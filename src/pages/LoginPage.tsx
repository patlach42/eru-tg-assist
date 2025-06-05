import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMTProto } from "@/mtproto";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1); // 1 for API key, 2 for 2FA
  const [apiKey, setApiKey] = useState<string>(
    localStorage.getItem("apiKey") || "",
  );
  const [apiID, setApiID] = useState<string>(
    localStorage.getItem("apiID") || "",
  );
  const [password, setPassword] = useState<string>("");
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>(
    localStorage.getItem("phoneNumber") || "",
  );
  const [phoneCodeHash, setPhoneCodeHash] = useState<string>("");
  const [error, setError] = useState<string>("");
  const {
    mtproto,
    set_api_id,
    set_api_hash,
    getUser,
    getPassword,
    sendCode,
    signIn,
    checkPassword,
  } = useMTProto();

  const handleApiKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("apiID", apiID);
    set_api_id(parseInt(apiID));
    set_api_hash(apiKey);
    // Simulate API key validation
    // In a real app, this would be an API call
    // if (apiKey === "VALID_API_KEY") {
    //   // Replace 'VALID_API_KEY' with your validation logic
    // Move to the next step
    setTimeout(() => {
      setStep(2);
    }, 100);
    // } else {
    //   setError("Invalid API Key. Please try again.");
    // }
  };

  useEffect(() => {
    if (!mtproto) {
      return;
    }
    if (step === 2) {
    }
  }, [mtproto, step]);

  const handleTwoFactorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    signIn({
      phone: phoneNumber,
      phone_code_hash: phoneCodeHash,
      code: twoFactorCode,
    })
      .then((response) => {})
      .catch((error) => {
        if (error.error_message === "SESSION_PASSWORD_NEEDED") {
          setStep(4);
        } else {
          setError("An error occurred. Please try again.");
        }
      });
  };

  const handlePhoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    localStorage.setItem("phoneNumber", phoneNumber);
    sendCode(phoneNumber)
      .then((response) => {
        if (response.phone_code_hash) {
          setPhoneCodeHash(response.phone_code_hash);
          setStep(3);
        } else {
          console.log(response);
          setError("Failed to send code. Please try again.");
        }
      })
      .catch((error) => {
        console.log(error);
        setError("Failed to send code. Please try again.");
      });
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    const { srp_id, current_algo, srp_B } = await getPassword();
    const { g, p, salt1, salt2 } = current_algo;

    const { A, M1 } = await mtproto.crypto.getSRPParams({
      g,
      p,
      salt1,
      salt2,
      gB: srp_B,
      password,
    });

    try {
      const checkPasswordResult = await checkPassword({ srp_id, A, M1 });
      if (checkPasswordResult.user) {
        localStorage.setItem("is_login", "true");
        navigate("/");
      } else {
        console.log(checkPasswordResult);
        setError("Failed to check password. Please try again.");
      }
    } catch (error) {
      console.log(error);
      setError("Failed to check password. Please try again.");
    }
  };

  const handleBack = () => {
    setStep(1);
    setError("");
    setTwoFactorCode(""); // Clear 2FA code when going back
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>
            {step === 1
              ? "Please enter your API key to proceed."
              : step === 2
                ? "Please enter your 2FA code."
                : ""}
          </CardDescription>
        </CardHeader>
        {step === 1 && (
          <form onSubmit={handleApiKeySubmit} className="space-y-2">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="number"
                  value={apiID}
                  onChange={(e) => setApiID(e.target.value)}
                  placeholder="Enter your API ID"
                  required
                />
                <Input
                  id="apiKey"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Next
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handlePhoneSubmit} className="space-y-2">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit">Login</Button>
            </CardFooter>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleTwoFactorSubmit} className="space-y-2">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="twoFactorCode">2FA Code</Label>
                <Input
                  id="twoFactorCode"
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter your 6-digit code"
                  required
                  maxLength={6}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit">Login</Button>
            </CardFooter>
          </form>
        )}
        {step === 4 && (
          <form onSubmit={handlePasswordSubmit} className="space-y-2">
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button type="submit">Login</Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};

export default LoginPage;
