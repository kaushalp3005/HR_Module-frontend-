"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginInput } from "@/lib/validation"
import { useAppStore } from "@/lib/store"
import { authenticateUser } from "@/lib/auth"

export default function LoginPage() {
  const router = useRouter()
  const user = useAppStore((state) => state.user)
  const login = useAppStore((state) => state.login)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Mark as hydrated after mount
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    
    // If user is already logged in, redirect to their dashboard
    if (user) {
      router.push(user.role === "hr" ? "/hr" : "/contractor")
    }
  }, [user, router, isHydrated])

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    setError(null)
    
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Auto-authenticate user based on email and password only
    const authenticatedUser = authenticateUser({
      email: data.email,
      password: data.password || "",
    })

    if (authenticatedUser) {
      login(
        authenticatedUser.email,
        authenticatedUser.role,
        authenticatedUser.contractorId,
        authenticatedUser.name
      )
      
      // Auto-redirect based on detected role
      const redirectPath = authenticatedUser.role === "hr" ? "/hr" : "/contractor"
      router.push(redirectPath)
    } else {
      setError("Invalid email or password. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 to-accent/5 p-4 sm:p-6 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl sm:text-3xl">Workers Management</CardTitle>
          <CardDescription className="text-sm sm:text-base">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" type="email" {...field} className="text-sm sm:text-base" />
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Enter your password" 
                          type={showPassword ? "text" : "password"}
                          {...field} 
                          className="text-sm sm:text-base pr-10" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-700 transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs sm:text-sm" />
                  </FormItem>
                )}
              />



              {error && (
                <div className="p-3 rounded-md bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full text-sm sm:text-base py-2 sm:py-3" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
