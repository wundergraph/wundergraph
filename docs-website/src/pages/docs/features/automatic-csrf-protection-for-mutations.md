---
title: Automatic CSRF protection for mutations
description: WunderGraph automatically protects you from CSRF attacks
---

Many services use cookies to remember if a user is authenticated or not.
It's a very convenient way, especially for modern Single Page Applications as it takes a lot of complexity out of the client.
At the same time, cookies open the door for an attacker to trick a user into making an action they didn't want to do, e.g. making a BitCoin transaction even though they didn't want to.

The solution to this problem is to return a CSRF token to the client once the user is authenticated.
If the user then makes a write Operation (Mutation), the client would have to send along this token.

An attacker who's tricking our user on their own fake website would still be able to use the cookie of the user.
However, they wouldn't have access to the CSRF token.
This way, it's possible to prevent attackers to make actions on behalf of a user if they don't have the matching CSRF token.

In reality, many developers might not be aware of this problem or don't know how to address it.

If you're using WunderGraph, both the server side component (WunderNode) and the generated client are implemented to protect you from CSRF attacks.

One problem less to worry about! =)
