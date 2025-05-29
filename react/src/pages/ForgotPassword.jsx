import React, { useState } from 'react';
import axiosClient from '@api/axios';
import { Loader as RsuiteLoader } from 'rsuite';
import { useNavigate } from 'react-router-dom';
import 'rsuite/dist/rsuite.min.css';
import logo from "@images/AceLogo.png";
import AnimatedBackground from "@components/AnimatedBackground";
import { motion } from "framer-motion";
import ErrorMessage from "@components/ErrorMessage";
import { HiOutlineMail, HiArrowLeft, HiUser, HiCheck } from "react-icons/hi";
import { FaUserShield } from "react-icons/fa";

const ForgotPassword = () => {
   const [email, setEmail] = useState('');
   const [message, setMessage] = useState('');
   const [isError, setIsError] = useState(false);
   const [loading, setLoading] = useState(false);
   const [isSubmitted, setIsSubmitted] = useState(false);
   const [verificationStep, setVerificationStep] = useState(false);
   const [accountInfo, setAccountInfo] = useState(null);
   const navigate = useNavigate();

   const clearErrorMessage = () => {
      setMessage('');
      setIsError(false);
   };

   const verifyEmail = async (e) => {
      e.preventDefault();
      setMessage('');
      setIsError(false);
      setLoading(true);

      try {
         const { data } = await axiosClient.post('/verify-email-exists', { email });
         setAccountInfo(data.accountInfo);
         setVerificationStep(true);
         setIsError(false);
      } catch (error) {
         setMessage(error.response?.data?.message || 'Email not found. Please check and try again.');
         setIsError(true);
      } finally {
         setLoading(false);
      }
   };

   const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('');
      setIsError(false);
      setLoading(true);

      try {
         const { data } = await axiosClient.post('/forgot-password', { email });
         setMessage(data.message);
         setIsError(false);
         setIsSubmitted(true);
      } catch (error) {
         setMessage(error.response?.data?.message || 'Something went wrong.');
         setIsError(true);
      } finally {
         setLoading(false);
      }
   };

   const resetForm = () => {
      setIsSubmitted(false);
      setVerificationStep(false);
      setAccountInfo(null);
      setEmail('');
      setMessage('');
   };

   // If the form has been submitted successfully, show the "check your email" interface
   if (isSubmitted && !isError) {
      return (
         <div className="relative flex items-center justify-center min-h-screen px-5 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AnimatedBackground />

            <div className="relative z-10 w-full max-w-lg">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
               >
                  <motion.div
                     initial={{ scale: 0.9 }}
                     animate={{ scale: 1 }}
                     className="flex justify-center mb-6"
                  >
                     {/* <img
                                src={logo}
                                loading="lazy"
                                alt="Logo"
                                className="w-auto h-24 transition-transform duration-300 hover:scale-105"
                            /> */}
                  </motion.div>

                  {/* Success state */}
                  <div className="flex flex-col items-center justify-center py-6">
                     <div className="flex items-center justify-center w-24 h-24 mb-6 bg-green-100 rounded-full">
                        <HiOutlineMail className="w-12 h-12 text-green-600" />
                     </div>

                     <h2 className="mb-2 text-2xl font-bold text-gray-900">Check Your Email</h2>
                     <p className="max-w-md mb-6 text-center text-gray-600">
                        We've sent a password reset link to <span className="font-semibold text-blue-600">{email}</span>.
                        Please check your inbox and follow the instructions.
                     </p>

                     <div className="p-4 mb-6 text-sm text-blue-700 border border-blue-200 rounded-lg bg-blue-50">
                        <p className="font-medium">The link will expire in 60 minutes.</p>
                        <p className="mt-1">If you don't see the email, check your spam folder.</p>
                     </div>

                     <div className="flex flex-col w-full gap-3 sm:flex-row">
                        <motion.button
                           type="button"
                           onClick={resetForm}
                           whileHover={{ scale: 1.01 }}
                           whileTap={{ scale: 0.99 }}
                           className="flex items-center justify-center flex-1 px-6 py-3 font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                           Try Different Email
                        </motion.button>

                        <motion.button
                           type="button"
                           onClick={() => navigate('/login')}
                           whileHover={{ scale: 1.01 }}
                           whileTap={{ scale: 0.99 }}
                           className="flex items-center justify-center flex-1 px-6 py-3 font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                           Back to Login
                        </motion.button>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      );
   }

   // Show account verification step
   if (verificationStep && accountInfo) {
      return (
         <div className="relative flex items-center justify-center min-h-screen px-5 bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <AnimatedBackground />

            <div className="relative z-10 w-full max-w-lg">
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
               >
                  <motion.div
                     initial={{ scale: 0.9 }}
                     animate={{ scale: 1 }}
                     className="flex justify-center mb-6"
                  >
                     {/* <img
                                src={logo}
                                loading="lazy"
                                alt="Logo"
                                className="w-auto h-24 transition-transform duration-300 hover:scale-105"
                            /> */}
                  </motion.div>

                  <div className="flex flex-col items-center justify-center py-4">
                     <div className="flex items-center justify-center w-20 h-20 mb-4 bg-blue-100 rounded-full">
                        <FaUserShield className="w-10 h-10 text-blue-600" />
                     </div>

                     <h2 className="mb-2 text-2xl font-bold text-gray-900">Confirm Your Account</h2>

                     <div className="w-full p-4 my-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-4">
                           <div className="flex-shrink-0">
                              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                                 {accountInfo.avatarUrl ? (
                                    <img
                                       src={accountInfo.avatarUrl}
                                       alt="Profile"
                                       className="w-12 h-12 rounded-full"
                                    />
                                 ) : (
                                    <span className="text-xl font-semibold text-blue-600">
                                       {accountInfo.name.charAt(0).toUpperCase()}
                                    </span>
                                 )}
                              </div>
                           </div>
                           <div>
                              <p className="text-sm font-medium text-gray-700">Name:</p>
                              <p className="font-semibold text-gray-900">{accountInfo.name}</p>
                              <p className="mt-1 text-sm font-medium text-gray-700">Email:</p>
                              <p className="font-semibold text-gray-900">{email}</p>
                           </div>
                        </div>
                     </div>

                     <p className="mb-6 text-center text-gray-600">
                        Is this your account? We'll send password reset instructions to this email.
                     </p>

                     <div className="flex flex-col w-full gap-3 sm:flex-row">
                        <motion.button
                           type="button"
                           onClick={() => setVerificationStep(false)}
                           whileHover={{ scale: 1.01 }}
                           whileTap={{ scale: 0.99 }}
                           className="flex items-center justify-center flex-1 px-6 py-3 font-medium text-gray-700 transition-all duration-200 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                           <HiArrowLeft className="mr-2" />
                           Back
                        </motion.button>

                        <motion.button
                           type="button"
                           onClick={handleSubmit}
                           disabled={loading}
                           whileHover={{ scale: loading ? 1 : 1.01 }}
                           whileTap={{ scale: loading ? 1 : 0.99 }}
                           className={`flex items-center justify-center flex-1 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg ${loading
                              ? "bg-blue-400 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-700"
                              }`}
                        >
                           {loading ? (
                              <div className="flex items-center gap-2">
                                 <RsuiteLoader size="sm" />
                                 <span>Sending...</span>
                              </div>
                           ) : (
                              <>
                                 <HiCheck className="mr-2" />
                                 Yes, Continue
                              </>
                           )}
                        </motion.button>
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>
      );
   }

   // Show the initial form for email entry
   return (
      <div className="relative flex items-center justify-center min-h-screen px-5 bg-gradient-to-br from-blue-50 via-white to-purple-50">
         <AnimatedBackground />

         <div className="relative z-10 w-full max-w-lg">
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
            >
               <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="flex justify-center mb-8"
               >
                  <img
                     src={logo}
                     loading="lazy"
                     alt="Logo"
                     className="w-auto h-32 transition-transform duration-300 hover:scale-105"
                  />
               </motion.div>

               <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
                  <p className="mt-2 text-sm text-gray-600">
                     Enter your email to find your account
                  </p>
               </div>

               <div className="mt-6">
                  {isError && message && (
                     <ErrorMessage error={message} onClear={clearErrorMessage} />
                  )}
               </div>

               <form onSubmit={verifyEmail} className="mt-8 space-y-6">
                  <div>
                     <label className="block mb-2 text-sm font-medium text-gray-700">
                        Email Address
                     </label>
                     <input
                        type="text"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200"
                     />
                  </div>

                  <motion.button
                     type="submit"
                     disabled={loading}
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                     className={`flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg ${loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        }`}
                  >
                     {loading ? (
                        <div className="flex items-center gap-2">
                           <RsuiteLoader size="sm" />
                           <span>Searching...</span>
                        </div>
                     ) : (
                        "Find Account"
                     )}
                  </motion.button>

                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="text-center"
                  >
                     <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="flex items-center justify-center mx-auto text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                     >
                        <HiArrowLeft className="mr-1" />
                        Back to Login
                     </button>
                  </motion.div>
               </form>
            </motion.div>
         </div>
      </div>
   );
};

export default ForgotPassword;
