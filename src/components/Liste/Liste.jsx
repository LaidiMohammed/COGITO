import "./Liste.css";
import Userinfo from "./Userinfo/Userinfo";
import Chatliste from "./ChatListe/ChatListe";

const Liste = () => {
  return (
    <div className="Liste">
      <Userinfo />
      <Chatliste />
    </div>
  );
};

export default Liste;
