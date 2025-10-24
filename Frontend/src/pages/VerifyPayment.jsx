import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

export default function VerifyPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ✅ Only use transaction_id for verification
  const transactionId = searchParams.get("transaction_id") || "";

  const [state, setState] = useState({
    status: "idle", // idle | loading | success | error | no-tx
    message: "",
    data: null,
    critical: false,
  });

  const API_BASE =
    process.env.REACT_APP_API_URL || "https://blug-be-api.onrender.com";

  useEffect(() => {
    if (!transactionId) {
      setState({
        status: "no-tx",
        message:
          "No transaction id found in the URL. If you completed payment, try 'Retry verification' or open the payment link again.",
        data: null,
        critical: false,
      });
      return;
    }
    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId]);

  async function verifyPayment() {
    const token = localStorage.getItem("token");

    setState({
      status: "loading",
      message: "Verifying payment with provider...",
      data: null,
      critical: false,
    });

    try {
      const res = await axios.post(
        `${API_BASE}/subscription/verify`,
        {
          // ✅ Only send transaction_id
          transaction_id: transactionId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 15000,
        }
      );

      const payload = res.data;

      const ok =
        res.status >= 200 &&
        res.status < 300 &&
        (payload?.success ||
          payload?.status === "success" ||
          payload?.message?.toLowerCase?.()?.includes("verified"));

      if (ok) {
        const normalized = {
          raw: payload,
          plan: payload.plan || payload.data?.plan,
          expiresAt:
            payload.expiresAt || payload.data?.expiresAt || payload.expiry,
          user: payload.user || payload.data?.user || null,
          transaction_id:
            payload.transaction_id ||
            payload.data?.transaction_id ||
            transactionId,
        };

        setState({
          status: "success",
          message: payload.message || "Payment verified — account upgraded.",
          data: normalized,
          critical: false,
        });

        // ✅ Redirect after 2s to /write page
        setTimeout(() => {
          navigate("/write");
        }, 2000);
      } else {
        setState({
          status: "error",
          message: payload?.message || "Payment not successful.",
          data: payload,
          critical: false,
        });
      }
    } catch (err) {
      console.error("Verify failed:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Verification failed due to network/server error.";
      const isUnauthorized =
        err?.response?.status === 401 || /unauthor/i.test(serverMsg);

      setState({
        status: "error",
        message: serverMsg,
        data: err?.response?.data || null,
        critical: isUnauthorized,
      });
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 12 },
    enter: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
  };

  const SuccessMark = () => (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
        <motion.svg
          initial={{ rotate: -20 }}
          animate={{ rotate: 0 }}
          className="w-10 h-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <motion.path
            d="M5 13l4 4L19 7"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div
        className="max-w-2xl w-full mx-4 rounded-2xl shadow-lg p-8 bg-gradient-to-b from-gray-950 to-gray-900 text-white"
        variants={containerVariants}
        initial="hidden"
        animate="enter"
        exit="exit"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Payment verification</h1>
            <p className="text-sm text-gray-300">
              Automatically verifying transaction and upgrading the user if successful.
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-green-600/20 text-green-300 text-xs">
              phantombluggers
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {state.status === "loading" && (
              <motion.div
                key="loading"
                layout
                className="p-6 rounded-xl border border-gray-700/40 bg-white/3"
              >
                <p className="font-medium">Verifying payment...</p>
              </motion.div>
            )}

            {state.status === "success" && (
              <motion.div
                key="success"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl border border-green-500/40 bg-white/5"
              >
                <SuccessMark />
                <p className="font-semibold text-lg">Payment confirmed</p>
                <p className="text-sm text-gray-300 mt-1">{state.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Redirecting you to the write page...
                </p>
              </motion.div>
            )}

            {state.status === "error" && (
              <motion.div
                key="error"
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-xl border border-red-500/30 bg-white/3"
              >
                <p className="font-semibold text-lg">Verification failed</p>
                <p className="text-sm text-gray-300 mt-1">{state.message}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
