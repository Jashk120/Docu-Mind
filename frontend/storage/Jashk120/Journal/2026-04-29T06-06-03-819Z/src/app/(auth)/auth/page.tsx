```typescript
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Adjust the path if necessary
import axios from 'axios';
import { signInSchema } from '@/schemas/signInSchema';

/**
 * Renders the sign-in form component for user authentication.
 *
 * This component provides a form for existing users to enter their email and password,
 * validates the input against the sign-in schema, submits the credentials to the login API,
 * and handles success or failure with appropriate toast notifications and redirection.
 *
 * @returns The JSX element representing the sign-in form page.
 */
export default function SignInForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Handles form submission for user login.
   *
   * Sends a POST request to the login API endpoint with the validated email and password.
   * On success, displays a success toast and redirects to the dashboard after a short delay.
   * On failure, displays an error toast with the server's error message or a generic message.
   *
   * @param data - The form data containing the user's email and password, validated against the sign-in schema.
   * @returns A promise that resolves after the request completes and any navigation occurs.
   */
  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    try {
      const response = await axios.post('/api/users/login', {
        email: data.email,
        password: data.password,
      });

      toast({
        title: 'Login Successful',
        description: response.data.message,
        variant: 'success'
      });

      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.replace('/');
      }, 500);
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || 'An error occurred during login';
      toast({
        title: 'Login Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-800">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Welcome Back to True Feedback
          </h1>
          <p className="mb-4">Sign in to continue your secret conversations</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
             name='email'
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <Input type="email"  {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="password"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <Input type="password" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit">Sign In</Button>
          </form>
        </Form>
        <div className="text-center mt-4">
          <p>
            Not a member yet?{' '}
            <Link href="/sign-up" className="text-blue-600 hover:text-blue-800">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```