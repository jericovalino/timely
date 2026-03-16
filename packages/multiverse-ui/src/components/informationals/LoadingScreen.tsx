import Text from "./Text";
import { PageWrapper } from "../containers";

const LoadingScreen = () => {
  return (
    <PageWrapper>
      <div className="flex items-center justify-center h-full">
        <Text size="body" className="text-gray-500">
          Loading...
        </Text>
      </div>
    </PageWrapper>
  );
};

export default LoadingScreen;
