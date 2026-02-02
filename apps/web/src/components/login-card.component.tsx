"use client";

import GoogleSignIn from "@/components/google-sign-in.component";
import { Card, CardBody, CardHeader } from "@heroui/react";

const LoginCard: React.FC = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-1 pb-0">
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-default-500">Sign in to your account</p>
      </CardHeader>
      <CardBody className="gap-4">
        <GoogleSignIn />
      </CardBody>
    </Card>
  );
};

export default LoginCard;
