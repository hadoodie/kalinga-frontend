import Layout from "../layouts/Layout";
import ResponderMessages from "../components/responder/Messages";

const Messages = () => {
  return (
    <Layout>
      <div className="h-[calc(100vh-120px)]">
        <ResponderMessages />
      </div>
    </Layout>
  );
};

export default Messages;
