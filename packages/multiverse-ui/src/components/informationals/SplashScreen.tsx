import { ColoredLogo } from "./AppIconLogo";

const SplashScreen = () => {
  return (
    <div className="fixed inset-0 z-50 h-full w-full grid place-items-center bg-gradient-to-br from-brand-950 to-brand-400">
      <ColoredLogo className="w-40 animate-pulse" />
    </div>
  );
};

export default SplashScreen;
