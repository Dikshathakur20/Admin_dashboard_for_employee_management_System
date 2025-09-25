return (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
    <h1 className="text-blue-700 text-3xl font-bold mb-8">Admin Portal</h1>
    
    <Card
      className="w-full max-w-md bg-white/95 dark:bg-gray-900/80 shadow-2xl rounded-3xl border border-white/30 backdrop-blur-md"
      style={{ background: 'linear-gradient(-45deg, #ffffff, #c9d0fb)' }}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-white">Login</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 mt-1">
            Enter your credentials to access the admin dashboard
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 mt-4">
          {/* Email Input */}
          <div className="space-y-1">
            <Label htmlFor="email" className="font-medium text-gray-700 dark:text-gray-200">
              Email or Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="email"
                type="text"
                placeholder="Enter email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
                autoComplete="off"
                className="pl-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <Label htmlFor="password" className="font-medium text-gray-700 dark:text-gray-200">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="pl-10 pr-10 bg-white border border-gray-400 shadow-sm text-black placeholder-gray-500 focus:ring-2 focus:ring-purple-400 focus:outline-none"
              />
              {showPassword ? (
                <EyeOff
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                  size={18}
                  onClick={() => setShowPassword(false)}
                />
              ) : (
                <Eye
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 cursor-pointer"
                  size={18}
                  onClick={() => setShowPassword(true)}
                />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="bg-[#001F7A] text-white px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-[#0029b0] transition text-sm"
            title="Click to sign in"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
          </Button>
        </CardContent>
      </form>
    </Card>
  </div>
);
