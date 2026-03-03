import { useState } from "react";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ForgotPW = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
        className:
          "flex flex-col items-center text-center justify-center w-full",
      });
      return;
    }

    toast({
      title: "Reset Link Sent",
      description: `A reset link has been sent to ${email}.`,
      className:
          "flex flex-col items-center text-center justify-center w-full",
    });

    setEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md bg-card shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password</h2>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-muted-foreground mb-2 text-left"
            >
              Email Address
            </label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-primary">
              <Mail className="h-4 w-4 text-muted-foreground mr-2" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Send Reset Link
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
};
