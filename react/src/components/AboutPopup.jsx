import PropTypes from 'prop-types';
import { memo } from "react";
import { Box } from "@mui/material";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Typography from "@mui/joy/Typography";
import Divider from "@mui/material/Divider";
import { useMediaQuery } from "@mui/material";

// Split content into smaller chunks for better performance
const FeaturesList = memo(() => (
   <ul className="p-5 mt-4 mb-6 space-y-4 list-disc list-inside bg-blue-50/80 rounded-xl">
      <li className="text-gray-700">
         <strong className="text-gray-900">Intuitive Dashboard</strong> - Upon logging
         in, you’ll be greeted by a sleek dashboard
         showcasing key statistics about your surveys. Track
         survey and response counts, view the latest surveys
         and responses, all in one place.
      </li>
      <li className="text-gray-700">
         <strong className="text-gray-900">Comprehensive Survey Management</strong> -
         Easily manage your surveys with our user-friendly
         interface. Update existing surveys, preview them
         before sharing, or delete them with just a click.
         Our dynamic card-based layout and pagination make
         navigating through your surveys a breeze.
      </li>
      <li className="text-gray-700">
         <strong className="text-gray-900">Customizable Survey Creation</strong> -
         Create surveys tailored to your needs with various
         question types including multiple choice,
         checkboxes, dropdowns, short answers, and
         paragraphs. Customize your surveys with titles,
         descriptions, images, and set expiry dates to
         control when responses are accepted.
      </li>
      <li className="text-gray-700">
         <strong className="text-gray-900">Share & Publish</strong> - Once your survey
         is ready, share it effortlessly by copying the
         survey link. Choose whether to publish your survey
         or keep it private – the choice is yours!
      </li>
      <li className="text-gray-700">
         <strong className="text-gray-900">Secure & User-Friendly</strong> - Our app is
         designed with you in mind, featuring a clean,
         user-friendly interface and robust security
         measures, including authentication and authorization
         to keep your data safe.
      </li>
   </ul>
));

const TechStack = memo(() => (
   <ul className="p-5 mt-4 space-y-3 list-disc list-inside bg-green-50/80 rounded-xl">
      <li className="text-gray-700">
         <strong className="text-gray-900">React JS</strong> for a dynamic and
         responsive frontend experience.
      </li>
      <li className="text-gray-700">
         <strong className="text-gray-900">Laravel</strong> for a robust and scalable
         backend solution.
      </li>
   </ul>
));

const AboutContent = memo(() => (
   <div className="p-6 overflow-auto">
      <Typography variant="body1" className="mb-8 leading-relaxed text-gray-700">
         Welcome to SurveyForm – a web application built with
         React JS and Laravel framework.
      </Typography>
      <Typography variant="h6" className="mt-2 mb-4 font-bold text-gray-900">
         Features
      </Typography>
      <FeaturesList />
      <Typography variant="h6" className="mt-6 mb-4 font-bold text-gray-900">
         Built With
      </Typography>
      <TechStack />
   </div>
));

const AboutPopup = memo(({ openAboutPopup, setOpenAboutPopup }) => {
   const handleClosePopup = () => setOpenAboutPopup(false);
   const isMobile = useMediaQuery("(max-width:600px)");

   const dynamicPopupStyle = {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "min(90%, 600px)",
      maxHeight: isMobile ? "95vh" : "calc(100vh - 100px)",
      padding: "16px",
      willChange: "transform", // Optimize for animations
      overflowY: "auto",
      overscrollBehavior: "contain", // Prevent scroll chaining
   };

   if (!openAboutPopup) return null;

   return (
      <Modal
         open={openAboutPopup}
         onClose={handleClosePopup}
         className="bg-black/20" // Replace backdrop-blur with simple overlay
         slotProps={{
            backdrop: {
               style: {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)'
               }
            }
         }}
      >
         <Box
            sx={{
               ...dynamicPopupStyle,
               bgcolor: "background.paper",
               borderRadius: "12px",
               boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
            className="scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500"
         >
            <div className="sticky top-0 z-10 p-4 bg-white">
               <div className="absolute right-0 -top-3">
                  <ModalClose
                     variant="outlined"
                     onClick={handleClosePopup}
                     className="transition-colors hover:bg-red-50 hover:text-red-600"
                  />
               </div>
               <Typography variant="h5" className="mb-4 font-bold text-center text-gray-900">
                  About SurveyForm
               </Typography>
               <Divider className="opacity-50" />
            </div>
            <AboutContent />
         </Box>
      </Modal>
   );
});

FeaturesList.displayName = 'FeaturesList';
TechStack.displayName = 'TechStack';
AboutContent.displayName = 'AboutContent';
AboutPopup.displayName = 'AboutPopup';

AboutPopup.propTypes = { openAboutPopup: PropTypes.bool, setOpenAboutPopup: PropTypes.func };

export default AboutPopup;
