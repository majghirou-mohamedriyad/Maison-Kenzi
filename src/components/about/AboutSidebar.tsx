import { NavLink } from "react-router-dom";

const aboutPages = [
  { name: "Notre Histoire", path: "/about/notre-histoire" },
  { name: "Ingrédients", path: "/about/ingredients" },
  { name: "Guide des Décants", path: "/about/guide-des-tailles" },
  { name: "Service Client", path: "/about/service-client" },
  { name: "Livraison", path: "/about/livraison" },
];

const AboutSidebar = () => {
  return (
    <aside className="hidden md:block w-64 sticky top-32 h-fit px-6">
      <nav className="space-y-1">
        <h3 className="font-serif text-2xl text-primary mb-6 tracking-wide">À propos</h3>
        {aboutPages.map((page) => (
          <NavLink
            key={page.path}
            to={page.path}
            className={({ isActive }) =>
              `block py-2 text-sm font-light transition-all ${
                isActive
                  ? "text-primary underline decoration-1 underline-offset-4"
                  : "text-muted-foreground hover:text-primary"
              }`
            }
          >
            {page.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AboutSidebar;
