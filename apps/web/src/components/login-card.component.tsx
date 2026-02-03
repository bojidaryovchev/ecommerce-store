import GoogleSignIn from "@/components/google-sign-in.component";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const LoginCard: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-1 pb-0">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to your account</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleSignIn />
      </CardContent>
    </Card>
  );
};

export default LoginCard;
