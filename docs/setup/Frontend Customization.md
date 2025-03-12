# Frontend Customization

This guide explains how to customize the frontend elements of Accelerate, including the 2FA modal and the card wallet. Customization is applied whenever Accelerate is initialized by including the custom theme in the script configuration.

## Applying Custom Themes
To apply a custom theme when initializing Accelerate, include the `customTheme` property in the script configuration.

### Example Initialization with Custom Theme
```tsx
<Script
  crossOrigin="anonymous"
  type="module"
  src={process.env.NEXT_PUBLIC_ACCELERATE_VERIFY_JS_SCRIPT}
  strategy="afterInteractive"
  onReady={() => {
    window.accelerate.init({
      amount: stripeOptions.amount,
      merchantId: process.env.NEXT_PUBLIC_MERCHANT_ID!,
      checkoutFlow: "Inline",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      checkoutMode: "CheckoutDotComToken" as any, // TODO: Fix typing
      onLoginSuccess: (user) => {
        console.log("Accelerate user logged in", { user });
        maybeUseAccelUser(user);
      },
      onCardSelected: (cardId) => {
        setCardId(cardId);
      },
      onLogout: () => {
        console.log("Accelerate user logged out");
      },
      customTheme: {
        fontFamily: "Lato",
        typography: {
          allVariants: {
            color: "rgba(0,0,0,0.85)",
            fontSize: "12px",
          },
          h2: {
            fontSize: "24px",
          },
          caption: {
            fontSize: "16px",
          },
        },
      },
    });
  }}
/>
```

## Customization Options

### Font Family
Set a custom font family by specifying the `fontFamily` property under `customTheme`.

```json
{
  "fontFamily": "Lato"
}
```

### Typography
Modify typography settings such as font size and color for different text elements.

#### Global Typography
```json
{
  "typography": {
    "allVariants": {
      "color": "rgba(0,0,0,0.85)",
      "fontSize": "12px"
    }
  }
}
```

#### Heading Customization
```json
{
  "typography": {
    "h2": {
      "fontSize": "24px"
    }
  }
}
```

#### Caption Styling
```json
{
  "typography": {
    "caption": {
      "fontSize": "16px"
    }
  }
}
```

## Summary
By applying the `customTheme` property during initialization, you can tailor the look and feel of Accelerate's frontend elements, such as the 2FA modal and card wallet, to match your brand's design requirements.
