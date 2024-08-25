import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';

export const VerifyCode = (code: string) => (
  <Html>
    <Head />
    <Preview>Hello!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Hr style={hr} />
          <Text style={paragraph}>Thanks for submitting your account information. You're almost set up!</Text>
          <Text style={paragraph}>Your verification code:</Text>
          <Text style={button}>{code}</Text>
          <Hr style={hr} />
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerifyCode;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#656ee8',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
};
