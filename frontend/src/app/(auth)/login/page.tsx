"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function LoginPage() {
  return (
    <Card className="w-full border-none bg-[#0f1117] p-4 text-white shadow-2xl ring-1 ring-white/5 sm:p-6">
      <Tabs defaultValue="login" className="mb-6 w-full lg:mb-8">
        <TabsList className="grid h-12 w-full grid-cols-2 rounded-none border-b border-white/10 bg-transparent p-0">
          <TabsTrigger 
            value="login" 
            className="rounded-none text-gray-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-500"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            asChild
            className="rounded-none text-gray-400 hover:text-white"
          >
            <Link href="/register">Sign Up</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <CardContent className="space-y-4 p-0">
        <div className="space-y-2">
          <Input 
            placeholder="Email / Username" 
            className="h-12 border-white/10 bg-[#161922] focus:ring-blue-500" 
          />
        </div>
        <div className="relative space-y-2">
          <Input 
            type="password" 
            placeholder="Password" 
            className="h-12 border-white/10 bg-[#161922] focus:ring-blue-500" 
          />
          <Link href="/reset-password" title="Lupa password" className="absolute right-3 top-3 text-xs text-blue-500 hover:underline sm:text-sm">
            Forgot password?
          </Link>
        </div>

        <Button className="h-12 w-full bg-blue-700 font-semibold transition-all hover:bg-blue-600">
          Log in
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase sm:text-xs">
            <span className="bg-[#0f1117] px-2 text-gray-500">Or, continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Button variant="outline" className="h-12 border-white/10 bg-[#161922] hover:bg-white/5">
             G <span className="hidden ml-1 sm:inline">Google</span>
          </Button>
          <Button variant="outline" className="h-12 border-white/10 bg-[#161922] hover:bg-white/5">
             f <span className="hidden ml-1 sm:inline">Facebook</span>
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-blue-500 hover:underline">
            Sign up
          </Link>
        </div>
      </CardContent>

      <CardFooter className="mt-8 flex justify-center gap-4 p-0 pt-6 text-[10px] text-gray-500 border-t border-white/5 sm:text-xs">
        <Link href="#" className="hover:text-white">Privacy</Link>
        <Link href="#" className="hover:text-white">Terms</Link>
        <Link href="#" className="hover:text-white">Help</Link>
      </CardFooter>
    </Card>
  );
}