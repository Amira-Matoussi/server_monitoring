import LoginForm from "./components/login-form"

export default function Home() {
  // In a real app, you'd check server-side session here
  // For demo purposes, we'll redirect to dashboard if query param is set
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Server Monitor</h1>
          <p className="text-muted-foreground mt-2">Login to access your server dashboard</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
