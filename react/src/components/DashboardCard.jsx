export default function DashboardCard({ children, className = "" }) {
   return <section className={'ace-card ' + className}>{children}</section>;
}
