import Order from "../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const SALES_STATUSES = ["DELIVERED"];

const getDateRange = (type, from, to) => {
    const now = new Date();

    let start;
    let end;

    if (type === "daily") {
        start = new Date(now);
        start.setHours(0, 0, 0, 0);

        end = new Date(now);
        end.setHours(23, 59, 59, 999);
    }

    else if (type === "weekly") {
        start = new Date(now);
        const day = start.getDay();

        const diff = day === 0 ? 6 : day - 1;

        start.setDate(start.getDate() - diff);
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
    }

    else if (type === "yearly") {
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }

    else if (type === "custom" && from && to) {
        start = new Date(from);
        start.setHours(0, 0, 0, 0);

        end = new Date(to);
        end.setHours(23, 59, 59, 999);
    }

    else {
        start = new Date(0);
        end = new Date();
    }

    return { start, end };
};


// ==============================
// REPORT DATA
// ==============================

export const getSalesReport = async (req, res) => {
    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const { start, end } =
            getDateRange(type, from, to);

        const orders = await Order.find({
            status: { $in: SALES_STATUSES },
            createdAt: {
                $gte: start,
                $lte: end
            }
        })
        .populate("user")
        .populate("items.product")
        .sort({ createdAt: -1 });


        let grossSales = 0;
        let totalDiscount = 0;
        let netSales = 0;
        let itemCount = 0;


        orders.forEach(order => {

            grossSales += order.subtotal || 0;

            totalDiscount +=
                order.couponDiscount || 0;

            netSales +=
                order.grandTotal || 0;

            order.items.forEach(item => {
                itemCount += item.quantity || 0;
            });

        });


        res.json({
            success: true,

            data: {
                orders,
                summary: {
                    salesCount: orders.length,
                    itemCount,
                    grossSales,
                    totalDiscount,
                    netSales
                },

                dateRange: {
                    start,
                    end
                }
            }
        });

    } catch (error) {

        console.error(
            "SALES REPORT ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Unable to generate sales report"
        });
    }
};


// ==============================
// PDF DOWNLOAD
// ==============================

export const downloadSalesReportPDF = async (req, res) => {

    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const { start, end } =
            getDateRange(type, from, to);


        const orders = await Order.find({
            status: { $in: SALES_STATUSES },
            createdAt: {
                $gte: start,
                $lte: end
            }
        })
        .populate("user")
        .sort({ createdAt: -1 });


        const salesCount = orders.length;

        const grossSales =
            orders.reduce(
                (sum, order) =>
                    sum + (order.subtotal || 0),
                0
            );

        const totalDiscount =
            orders.reduce(
                (sum, order) =>
                    sum + (order.couponDiscount || 0),
                0
            );

        const netSales =
            orders.reduce(
                (sum, order) =>
                    sum + (order.grandTotal || 0),
                0
            );


        const doc = new PDFDocument({
            margin: 50
        });


        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=sales-report-${type}.pdf`
        );


        doc.pipe(res);


        doc.fontSize(24)
            .text("Alder & Ash", {
                align: "center"
            });

        doc.moveDown();

        doc.fontSize(18)
            .text("Sales Report", {
                align: "center"
            });

        doc.moveDown();


        doc.fontSize(11)
            .text(
                `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
            );

        doc.moveDown(2);


        doc.fontSize(14)
            .text("Summary");

        doc.moveDown();


        doc.fontSize(12)
            .text(`Sales Count: ${salesCount}`);

        doc.text(
            `Gross Sales: Rs. ${grossSales.toFixed(2)}`
        );

        doc.text(
            `Discounts: Rs. ${totalDiscount.toFixed(2)}`
        );

        doc.text(
            `Net Sales: Rs. ${netSales.toFixed(2)}`
        );


        doc.moveDown(2);


        doc.fontSize(14)
            .text("Orders");

        doc.moveDown();


        orders.forEach(order => {

            doc.fontSize(10)
                .text(
                    `${order.orderId} | ${order.createdAt.toLocaleDateString()} | Rs. ${order.grandTotal.toFixed(2)}`
                );

        });


        doc.moveDown(2);

        doc.fontSize(10)
            .text(
                "Generated by Alder & Ash Admin"
            );


        doc.end();

    } catch (error) {

        console.error(
            "PDF REPORT ERROR:",
            error
        );

        res.status(500).send(
            "Unable to generate PDF report"
        );
    }
};


// ==============================
// EXCEL DOWNLOAD
// ==============================

export const downloadSalesReportExcel = async (req, res) => {

    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const { start, end } =
            getDateRange(type, from, to);


        const orders = await Order.find({
            status: { $in: SALES_STATUSES },
            createdAt: {
                $gte: start,
                $lte: end
            }
        })
        .populate("user")
        .sort({ createdAt: -1 });


        const workbook =
            new ExcelJS.Workbook();

        const worksheet =
            workbook.addWorksheet("Sales Report");


        worksheet.columns = [
            {
                header: "Order ID",
                key: "orderId",
                width: 20
            },
            {
                header: "Date",
                key: "date",
                width: 15
            },
            {
                header: "Customer",
                key: "customer",
                width: 25
            },
            {
                header: "Subtotal",
                key: "subtotal",
                width: 15
            },
            {
                header: "Discount",
                key: "discount",
                width: 15
            },
            {
                header: "Order Amount",
                key: "amount",
                width: 15
            },
            {
                header: "Payment Method",
                key: "paymentMethod",
                width: 18
            },
            {
                header: "Status",
                key: "status",
                width: 15
            }
        ];


        orders.forEach(order => {

            worksheet.addRow({

                orderId: order.orderId,

                date:
                    order.createdAt
                        .toLocaleDateString(),

                customer:
                    `${order.user?.firstName || ""} ${order.user?.lastName || ""}`,

                subtotal:
                    order.subtotal || 0,

                discount:
                    order.couponDiscount || 0,

                amount:
                    order.grandTotal || 0,

                paymentMethod:
                    order.paymentMethod,

                status:
                    order.status

            });

        });


        const totalRow =
            worksheet.addRow({});

        totalRow.getCell(1).value =
            "TOTAL";


        totalRow.getCell(4).value =
            orders.reduce(
                (sum, order) =>
                    sum + (order.subtotal || 0),
                0
            );

        totalRow.getCell(5).value =
            orders.reduce(
                (sum, order) =>
                    sum + (order.couponDiscount || 0),
                0
            );

        totalRow.getCell(6).value =
            orders.reduce(
                (sum, order) =>
                    sum + (order.grandTotal || 0),
                0
            );


        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename=sales-report-${type}.xlsx`
        );


        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.error(
            "EXCEL REPORT ERROR:",
            error
        );

        res.status(500).send(
            "Unable to generate Excel report"
        );
    }
};