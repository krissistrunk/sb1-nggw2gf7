# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - heading "Welcome Back" [level=1] [ref=e11]
    - paragraph [ref=e12]: Sign in to continue your RPM journey
  - generic [ref=e13]: An unexpected error occurred
  - generic [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]: Email
      - textbox "Email" [ref=e17]:
        - /placeholder: you@example.com
        - text: sarah@test.com
    - generic [ref=e18]:
      - generic [ref=e19]: Password
      - textbox "Password" [ref=e20]:
        - /placeholder: ••••••••
        - text: test123
    - button "Sign In" [ref=e21] [cursor=pointer]
  - paragraph [ref=e23]:
    - text: Don't have an account?
    - link "Sign up" [ref=e24] [cursor=pointer]:
      - /url: /signup
```