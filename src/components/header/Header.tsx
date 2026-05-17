const Header = () => null;
// Header layout moved into Navigation (with built-in announcement bar + sticky glass nav)
import Navigation from "./Navigation";
const HeaderWrap = () => (
  <header className="w-full">
    <Navigation />
  </header>
);
export default HeaderWrap;
