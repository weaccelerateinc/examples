---
icon: user
---

# Authentication and Session

### Authentication Guide

This guide provides an overview of the authentication process when integrating with Accelerate, including the use of the `accelerate.login` and `accelerate.checkPhone` functions, session duration, and handling session timeouts.

To authenticate a user, follow these steps:

#### Collect User Information

Obtain the user's first name, last name, email, and phone number through your application's input fields.

#### Call `accelerate.login`

After collecting the user's information, invoke the `accelerate.login` function. This function attempts to log in the user if an account exists or create a new account if it doesn't. In the provided demos, this check occurs during the `onBlur` event for these fields.

```
// Example from the demo
const handleBlur = async () => {
  await accelerate.login({ firstName, lastName, email, phone });
};
```

For a detailed implementation, refer to the integrated demo [page](../../../demos/app/integrated/page.tsx#L146).

It is recommended have basic validation logic before calling the API. See [Example](../../../demos/app/integrated/page.tsx#L76).

#### Two-Factor Authentication (2FA) Prompt

Upon calling `accelerate.login`, Accelerate will determine if the user requires 2FA. The conditions for displaying the 2FA pop-up are as follows:

- If the user's account exists, Accelerate will prompt for 2FA.
- If the account doesn't exist, Accelerate will create a new account and then prompt for 2FA.

#### Optional `accelerate.checkPhone` Function

You can use the `accelerate.checkPhone` function to verify if a phone number corresponds to an existing Accelerate user. This function is optional and can be called frequently (e.g., every time the phone field changes) since it doesn't attempt to create a new user.

```
// Example usage
const handlePhoneChange = async (phone) => {
  const exists = await accelerate.checkPhone(phone);
  // Handle the result accordingly
};
```

Implementing `accelerate.checkPhone` is optional; generally, invoking `accelerate.login` is sufficient.

### Session Duration

After a successful 2FA, the Accelerate login session lasts for 30 minutes. For an example of handling session duration, see the [example](../../../demos/app/test/checkoutdotcom/inline/page.tsx#L145).

### Checking the session

The script also exposes a function to check the user's session state imperatively. `isLoggedIn` may be called to check as shown in the [example](https://github.com/weaccelerateinc/examples/blob/cdcee677be0fd70c90c5dc5af23ca3e97546ad27/demos/app/test/stripe/inline/page.tsx#L92).

```

isLoggedIn: (request: LoginRequest) => Promise<boolean>;

```

The parameters used should be the same that would be passed to `login`.

```
const isLoggedIn = await window.accelerate.isLoggedIn({
  firstName,
  lastName,
  phoneNumber,
  email
});
```

### Handling Session Timeout and Re-authentication

The user's authentication is managed by the browser, storing credentials for Accelerate's domain using the iframe (cookies/local storage, etc.). The calls made communicate with the iframe and call Accelerate's API on the user's behalf, so your application doesn't directly handle sessions or authentication. If the session needs to be refreshed, calling accelerate.login triggers the 2FA flow, renewing the user's credentials.

To handle session timeouts and re-authentication:

1. **Detect Session Expiry**: If a request returns a `401` status, it indicates that the user's session has expired. The `accelerate.requestSource` function will return an object with the `status` property set to `401`.
2. **Re-initiate Login**: Call `accelerate.login` with the user's first name, last name, email, and phone number to trigger the 2FA flow again.

````

// Example of re-authentication
const handleSessionExpiry = async () => {
accelerate.closeWallet(); // Close Wallet if it was open
await accelerate.login({ firstName, lastName, email, phone });
// Proceed with the original request after re-authentication
};

```

3. **Resume Operations**: After successful re-authentication, retry the original request or operation that failed due to session expiry. The `userLoggedIn` callback will be triggered by the library, allowing you to reattempt the `accelerate.requestSource` call. If the user had their wallet opened before, you may now call `accelerate.openWallet` again.

This approach ensures a seamless user experience, allowing users to continue their tasks without significant interruptions.
```
````
