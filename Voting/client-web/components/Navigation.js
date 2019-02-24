import Link from "next/link";

const linkStyle = {
  marginRight: 15
};

const Navigation = () => (
  <div>
    <Link href="/" as={`${BASE_PATH}/`}>
      <a style={linkStyle}>Home</a>
    </Link>
    <Link href="/stakeholder" as={`${BASE_PATH}/stakeholder`}>
      <a style={linkStyle}>Stakeholder</a>
    </Link>
    <Link href="/guardian" as={`${BASE_PATH}/guardian`}>
      <a style={linkStyle}>Guardian</a>
    </Link>
  </div>
);

export default Navigation;
