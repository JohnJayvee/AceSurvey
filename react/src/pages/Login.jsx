import { useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "@api/axios";
import { useStateContext } from "@context/ContextProvider";

import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Loader as RsuiteLoader } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import Bulb from "@components/Bulb";
import logo from "@images/AceLogo.png";

import { motion } from "framer-motion";
import ErrorMessage from "@components/ErrorMessage";

// Constants moved outside component
const INPUT_CLASS = "w-full px-4 py-3 text-gray-900 transition-all duration-200 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 hover:border-blue-200";

const ANIMATIONS = {
   container: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 }
   },
   logo: {
      initial: { scale: 0.9 },
      animate: { scale: 1 }
   }
};

export default function Login() {
   const { setCurrentUser, setUserToken } = useStateContext();

   // Form state
   const [formData, setFormData] = useState({
      login: "",
      password: "",
      keepSignedIn: false
   });

   // UI state
   const [uiState, setUiState] = useState({
      showPassword: false,
      loading: false,
      error: ""
   });

   // Handlers
   const handleInputChange = (field) => (ev) => {
      setFormData(prev => ({
         ...prev,
         [field]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value
      }));
   };

   const toggleShowPassword = () => {
      setUiState(prev => ({ ...prev, showPassword: !prev.showPassword }));
   };

   const clearError = () => {
      setUiState(prev => ({ ...prev, error: "" }));
   };

   const setLoading = (loading) => {
      setUiState(prev => ({ ...prev, loading }));
   };

   const setError = (error) => {
      setUiState(prev => ({ ...prev, error }));
   };

   // Extract error handling logic
   const handleLoginError = (error) => {
      let errorMessage = "Login or password is incorrect";

      if (error.response) {
         if (error.response.status === 401) {
            errorMessage = "Login or password is incorrect";
         } else {
            const errors = error.response.data.errors || {
               message: [error.response.data.message || errorMessage],
            };
            const finalErrors = Object.values(errors).reduce(
               (accum, next) => [...accum, ...next],
               []
            );
            errorMessage = finalErrors.join("\n");
         }
      }

      setError(errorMessage);
      console.error(error);
   };

   // Extract login success logic
   const handleLoginSuccess = (data) => {
      setCurrentUser(data.user);
      setUserToken(data.token, formData.keepSignedIn, data.user, data.show_welcome_tour);
   };

   // Main submit handler
   const handleSubmit = async (ev) => {
      ev.preventDefault();
      if (uiState.loading) return;
      clearError();
      setLoading(true);

      try {
         const { data } = await axiosClient.post("/login", {
            login: formData.login,
            password: formData.password,
         });
         handleLoginSuccess(data);
      } catch (error) {
         handleLoginError(error);
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="relative flex flex-col justify-between min-h-screen">


         <motion.div
            className="absolute z-10 top-10 right-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
         >
            <Bulb />
         </motion.div>

         <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-4 mx-auto my-auto">
            <motion.div
               initial={ANIMATIONS.container.initial}
               animate={ANIMATIONS.container.animate}
               className="w-full p-8 bg-white border-0 shadow-xl rounded-2xl backdrop-blur-xl"
            >
               <motion.div
                  initial={ANIMATIONS.logo.initial}
                  animate={ANIMATIONS.logo.animate}
                  className="flex justify-center mb-8"
               >
                  <img
                     src={logo}
                     loading="lazy"
                     alt="AceSurvey Logo"
                     className="w-auto h-32 transition-transform duration-300 hover:scale-105"
                  />
               </motion.div>

               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="text-center">
                     <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                     <p className="mt-2 text-sm text-gray-600">Login to your account to continue</p>
                  </div>

                  <ErrorMessage error={uiState.error} onClear={clearError} />

                  <div className="space-y-4">
                     <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-700">
                           Email or username
                        </label>
                        <input
                           id="username"
                           type="text"
                           placeholder="you@example.com"
                           autoComplete="username"
                           required
                           value={formData.login}
                           onChange={handleInputChange('login')}
                           className={INPUT_CLASS}
                        />
                     </div>

                     <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-700">
                           Password
                        </label>
                        <div className="relative">
                           <input
                              id="password"
                              autoComplete="current-password"
                              required
                              type={uiState.showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={formData.password}
                              onChange={handleInputChange('password')}
                              className={INPUT_CLASS}
                           />
                           <button
                              type="button"
                              onClick={toggleShowPassword}
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 transition-colors hover:text-gray-600"
                              aria-label={uiState.showPassword ? "Hide password" : "Show password"}
                           >
                              {uiState.showPassword ? (
                                 <FaEye className="w-5 h-5" />
                              ) : (
                                 <FaEyeSlash className="w-5 h-5" />
                              )}
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                     <label className="flex items-center justify-center sm:justify-start">
                        <input
                           type="checkbox"
                           checked={formData.keepSignedIn}
                           onChange={handleInputChange('keepSignedIn')}
                           className="w-4 h-4 text-blue-600 transition-colors border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="ml-2 text-sm text-gray-600">Keep me signed in</span>
                     </label>

                     <div className="text-center sm:text-right">
                        <Link
                           to="/forgot-password"
                           className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
                        >
                           Forgot password?
                        </Link>
                     </div>
                  </div>

                  <motion.button
                     type="submit"
                     disabled={uiState.loading}
                     whileHover={{ scale: 1.01 }}
                     whileTap={{ scale: 0.99 }}
                     className={`flex items-center justify-center w-full gap-2 px-6 py-3 font-medium text-white transition-all duration-200 rounded-lg ${uiState.loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        }`}
                  >
                     {uiState.loading ? (
                        <div className="flex items-center gap-2">
                           <RsuiteLoader size="sm" />
                           <span>Signing in...</span>
                        </div>
                     ) : (
                        "Sign in"
                     )}
                  </motion.button>
               </form>
            </motion.div>
         </div>
      </div>
   );
}
