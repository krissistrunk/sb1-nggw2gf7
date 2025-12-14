# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "Welcome Back" [level=1] [ref=e11]
    - paragraph [ref=e12]: Sign in to continue your RPM journey
  - generic [ref=e13]:
    - generic [ref=e14]:
      - generic [ref=e15]: Email
      - textbox "Email" [ref=e16]:
        - /placeholder: you@example.com
        - text: sarah@test.com
    - generic [ref=e17]:
      - generic [ref=e18]: Password
      - textbox "Password" [ref=e19]:
        - /placeholder: ••••••••
        - text: wrongpassword
    - button "Signing in..." [disabled] [ref=e20]
  - paragraph [ref=e22]:
    - text: Don't have an account?
    - link "Sign up" [ref=e23] [cursor=pointer]:
      - /url: /signup
```