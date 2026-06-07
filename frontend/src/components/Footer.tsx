export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark text-light mt-auto py-3">
      <div className="container d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
        <span className="text-muted small">
          &copy; {year} Pulumi App. All rights reserved.
        </span>
        <span className="text-muted small">Built with React & Bootstrap</span>
      </div>
    </footer>
  );
}
