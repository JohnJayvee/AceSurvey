import PropTypes from 'prop-types';
export default function DashboardCard({ children, className = "" }) {
   return <section className={'ace-card ' + className}>{children}</section>;
}
DashboardCard.propTypes = {
   children: PropTypes.node,
   className: PropTypes.string,
};
