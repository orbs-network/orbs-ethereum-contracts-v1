import Navigation from "../components/Navigation";
import Header from "../components/Header";

const Index = () => {
  const connectMetamask = () => {
    return window.ethereum.enable().then(
      addresses => {
        console.log(`Metamask is connected to ${addresses[0]}`);
      },
      err => {
        console.warn(err);
      }
    );
  };
  return (
    <div>
      <Header />
      <Navigation />
      <div>
        <h1>Welcome to Orbs Voting</h1>
      </div>
      <div>
        <button onClick={connectMetamask}>Connect Metamask</button>
      </div>
    </div>
  );
};

export default Index;
