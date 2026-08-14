import Wallet from "../models/walletModel.js";

export const getWallet = async (req, res) => {
    try {

        const userId = req.session.user.id;

        let wallet = await Wallet.findOne({
            user: userId
        });

        if (!wallet) {
            wallet = await Wallet.create({
                user: userId,
                walletId: `WALLET-${Date.now()}`,
                balance: 0,
                transactions: []
            });
        }

        res.status(200).json({
            success: true,
            wallet
        });

    } catch (error) {

        console.log(
            "GET WALLET ERROR:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to load wallet"
        });
    }
};
export const creditWallet = async (req, res) => {
  try {

      const userId = req.session.user.id;
      const { amount, description, orderId } = req.body;

      if (!amount || amount <= 0) {
          return res.status(400).json({
              success: false,
              message: "Invalid amount"
          });
      }

      let wallet = await Wallet.findOne({
          user: userId
      });

      if (!wallet) {
          wallet = await Wallet.create({
              user: userId,
              walletId: `WALLET-${Date.now()}`,
              balance: 0,
              transactions: []
          });
      }

      wallet.balance += Number(amount);

      wallet.transactions.push({
          type: "CREDIT",
          amount: Number(amount),
          balanceAfter: wallet.balance,
          description: description || "Wallet credit",
          orderId: orderId || null
      });

      await wallet.save();

      res.status(200).json({
          success: true,
          message: "Amount added to wallet",
          balance: wallet.balance
      });

  } catch (error) {

      console.log(
          "CREDIT WALLET ERROR:",
          error.message
      );

      res.status(500).json({
          success: false,
          message: "Unable to credit wallet"
      });
  }
};
export const debitWallet = async (req, res) => {
  try {

      const userId = req.session.user.id;
      const { amount, description, orderId } = req.body;

      if (!amount || amount <= 0) {
          return res.status(400).json({
              success: false,
              message: "Invalid amount"
          });
      }

      const wallet = await Wallet.findOne({
          user: userId
      });

      if (!wallet) {
          return res.status(404).json({
              success: false,
              message: "Wallet not found"
          });
      }

      if (wallet.balance < Number(amount)) {
          return res.status(400).json({
              success: false,
              message: "Insufficient wallet balance"
          });
      }

      wallet.balance -= Number(amount);

      wallet.transactions.push({
          type: "DEBIT",
          amount: Number(amount),
          balanceAfter: wallet.balance,
          description: description || "Wallet payment",
          orderId: orderId || null
      });

      await wallet.save();

      res.status(200).json({
          success: true,
          message: "Payment successful",
          balance: wallet.balance
      });

  } catch (error) {

      console.log(
          "DEBIT WALLET ERROR:",
          error.message
      );

      res.status(500).json({
          success: false,
          message: "Unable to process wallet payment"
      });
  }
};
