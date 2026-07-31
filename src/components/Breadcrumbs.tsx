
import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="mb-6 flex w-fit max-w-full items-center gap-1.5 overflow-hidden rounded-full border border-border/50 bg-card/60 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-md">
      <Link
        to="/dashboard"
        className="flex items-center rounded-full p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
          {item.href ? (
            <Link to={item.href} className="truncate hover:text-primary">
              {item.label}
            </Link>
          ) : (
            <span className="truncate font-medium text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
