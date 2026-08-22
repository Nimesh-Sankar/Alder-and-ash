import Order from "../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const SALES_STATUSES = [
    "DELIVERED",
    "RETURNED"
];

const getDateRange = (type, from, to) => {

    const now = new Date();

    let start;
    let end;

    if (type === "daily") {

        start = new Date(now);
        start.setHours(0, 0, 0, 0);

        end = new Date(now);
        end.setHours(23, 59, 59, 999);

    } else if (type === "weekly") {

        start = new Date(now);

        const day = start.getDay();

        const diff =
            day === 0 ? 6 : day - 1;

        start.setDate(
            start.getDate() - diff
        );

        start.setHours(0, 0, 0, 0);

        end = new Date(start);

        end.setDate(
            start.getDate() + 6
        );

        end.setHours(
            23,
            59,
            59,
            999
        );

    } else if (type === "yearly") {

        start = new Date(
            now.getFullYear(),
            0,
            1
        );

        end = new Date(
            now.getFullYear(),
            11,
            31,
            23,
            59,
            59,
            999
        );

    } else if (
        type === "custom" &&
        from &&
        to
    ) {

        start = new Date(from);
        start.setHours(0, 0, 0, 0);

        end = new Date(to);
        end.setHours(23, 59, 59, 999);

    } else {

        start = new Date(0);
        end = new Date();
    }

    return {
        start,
        end
    };
};


// ====================================
// SALES REPORT DATA
// ====================================

export const getSalesReport = async (req, res) => {

    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const {
            start,
            end
        } = getDateRange(
            type,
            from,
            to
        );

        const orders =
            await Order.find({

                status: {
                    $in: SALES_STATUSES
                },

                createdAt: {
                    $gte: start,
                    $lte: end
                }

            })
            .populate("user")
            .populate("items.product")
            .sort({
                createdAt: -1
            });


        let grossSales = 0;

        let totalDiscount = 0;

        let totalRefund = 0;

        let netSales = 0;

        let itemCount = 0;


        orders.forEach(order => {

            const subtotal =
                order.subtotal || 0;

            const discount =
                order.couponDiscount || 0;

            const refund =
                order.refundedAmount || 0;

            const amount =
                order.grandTotal || 0;


            grossSales += subtotal;

            totalDiscount +=
                discount;

            totalRefund +=
                refund;

            /*
             * Actual retained revenue after
             * refunds.
             */
            netSales +=
                Math.max(
                    0,
                    amount - refund
                );


            order.items.forEach(item => {

                /*
                 * Don't count cancelled or
                 * returned merchandise as
                 * currently sold items.
                 */
                if (
                    item.status !== "CANCELLED" &&
                    item.status !== "RETURNED"
                ) {
                    itemCount +=
                        item.quantity || 0;
                }

            });

        });


        return res.status(200).json({

            success: true,

            data: {

                orders,

                summary: {

                    salesCount:
                        orders.length,

                    itemCount,

                    grossSales,

                    totalDiscount,

                    totalRefund,

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

        return res.status(500).json({
            success: false,
            message:
                "Unable to generate sales report"
        });

    }

};


// ====================================
// PDF DOWNLOAD
// ====================================

export const downloadSalesReportPDF =
async (req, res) => {

    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const {
            start,
            end
        } = getDateRange(
            type,
            from,
            to
        );


        const orders =
            await Order.find({

                status: {
                    $in: SALES_STATUSES
                },

                createdAt: {
                    $gte: start,
                    $lte: end
                }

            })
            .populate("user")
            .sort({
                createdAt: -1
            });


        const salesCount =
            orders.length;


        const grossSales =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (order.subtotal || 0),
                0
            );


        const totalDiscount =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (
                        order.couponDiscount ||
                        0
                    ),
                0
            );


        const totalRefund =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (
                        order.refundedAmount ||
                        0
                    ),
                0
            );


        const netSales =
            orders.reduce(
                (sum, order) => {

                    const amount =
                        order.grandTotal || 0;

                    const refund =
                        order.refundedAmount || 0;

                    return (
                        sum +
                        Math.max(
                            0,
                            amount - refund
                        )
                    );

                },
                0
            );


        const doc =
            new PDFDocument({
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


        doc
            .fontSize(24)
            .text(
                "Alder & Ash",
                {
                    align: "center"
                }
            );


        doc.moveDown();


        doc
            .fontSize(18)
            .text(
                "Sales Report",
                {
                    align: "center"
                }
            );


        doc.moveDown();


        doc
            .fontSize(11)
            .text(
                `Period: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
            );


        doc.moveDown(2);


        doc
            .fontSize(14)
            .text(
                "Summary"
            );


        doc.moveDown();


        doc
            .fontSize(12)
            .text(
                `Sales Count: ${salesCount}`
            );


        doc.text(
            `Gross Sales: Rs. ${grossSales.toFixed(2)}`
        );


        doc.text(
            `Discounts: Rs. ${totalDiscount.toFixed(2)}`
        );


        doc.text(
            `Refunds: Rs. ${totalRefund.toFixed(2)}`
        );


        doc.text(
            `Net Sales: Rs. ${netSales.toFixed(2)}`
        );


        doc.moveDown(2);


        doc
            .fontSize(14)
            .text(
                "Orders"
            );


        doc.moveDown();


        orders.forEach(order => {

            const refund =
                order.refundedAmount || 0;

            const netAmount =
                Math.max(
                    0,
                    (order.grandTotal || 0) -
                    refund
                );


            doc
                .fontSize(10)
                .text(
                    `${order.orderId} | ${order.createdAt.toLocaleDateString()}`
                );

            doc.text(
                `Order: Rs. ${(order.grandTotal || 0).toFixed(2)} | Refund: Rs. ${refund.toFixed(2)} | Net: Rs. ${netAmount.toFixed(2)}`
            );

            doc.moveDown(0.5);

        });


        doc.moveDown(2);


        doc
            .fontSize(10)
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


// ====================================
// EXCEL DOWNLOAD
// ====================================

export const downloadSalesReportExcel =
async (req, res) => {

    try {

        const {
            type = "daily",
            from,
            to
        } = req.query;

        const {
            start,
            end
        } = getDateRange(
            type,
            from,
            to
        );


        const orders =
            await Order.find({

                status: {
                    $in: SALES_STATUSES
                },

                createdAt: {
                    $gte: start,
                    $lte: end
                }

            })
            .populate("user")
            .sort({
                createdAt: -1
            });


        const workbook =
            new ExcelJS.Workbook();


        const worksheet =
            workbook.addWorksheet(
                "Sales Report"
            );


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
                header: "Refund Amount",
                key: "refund",
                width: 15
            },

            {
                header: "Net Amount",
                key: "netAmount",
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
                width: 18
            }

        ];


        orders.forEach(order => {

            const refund =
                order.refundedAmount || 0;

            const amount =
                order.grandTotal || 0;

            const netAmount =
                Math.max(
                    0,
                    amount - refund
                );


            worksheet.addRow({

                orderId:
                    order.orderId,

                date:
                    order.createdAt
                        .toLocaleDateString(),

                customer:
                    `${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim(),

                subtotal:
                    order.subtotal || 0,

                discount:
                    order.couponDiscount || 0,

                amount,

                refund,

                netAmount,

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


        // Subtotal
        totalRow.getCell(4).value =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (order.subtotal || 0),
                0
            );


        // Discount
        totalRow.getCell(5).value =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (
                        order.couponDiscount ||
                        0
                    ),
                0
            );


        // Order amount
        totalRow.getCell(6).value =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (
                        order.grandTotal ||
                        0
                    ),
                0
            );


        // Refund
        totalRow.getCell(7).value =
            orders.reduce(
                (sum, order) =>
                    sum +
                    (
                        order.refundedAmount ||
                        0
                    ),
                0
            );


        // Net amount
        totalRow.getCell(8).value =
            orders.reduce(
                (sum, order) => {

                    const amount =
                        order.grandTotal || 0;

                    const refund =
                        order.refundedAmount || 0;

                    return (
                        sum +
                        Math.max(
                            0,
                            amount - refund
                        )
                    );

                },
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