//language=handlebars
export const template = `
# Follow this guide to configure your Authentication Providers
{{#each providers}}


## Provider: {{providerID}} ({{providerKind}})

### Authorization Callback URL

Make sure to register this URL on your Authentication Provider.
If you don't or misspell the URL, you'll get an invalid callback URL error when trying to log in a user.
Remember that the authentication flow is handled server-side, on the WunderNode.
It's not handled on the server that's hosting the frontend.

\`\`\`
{{protocol}}://{{hostPort}}/{{apiName}}/{{branch}}/auth/cookie/callback/{{providerID}}
{{/each}}
\`\`\`
`;
