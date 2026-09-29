import PropTypes from 'prop-types';
export default function Footer({ className = "" }) {
   return <footer className={'ace-simple-footer ' + className}>© {new Date().getFullYear()} AceSurvey · Made for meaningful feedback</footer>;
}
Footer.propTypes = {
   className: PropTypes.string,
};
