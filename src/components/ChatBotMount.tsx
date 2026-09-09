import { useLocation } from "react-router-dom";
import ChatBot from "./ChatBot";

const ChatBotMount = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  return <ChatBot />;
};

export default ChatBotMount;
