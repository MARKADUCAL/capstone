# Domain Setup Guide for autowashhub.online

This guide will help you connect your custom domain `autowashhub.online` to your Vercel deployment.

## Step 1: Add Domain in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **AutoWashHub** project
3. Click on **Settings** tab
4. Click on **Domains** in the left sidebar
5. Click **Add Domain** button
6. Enter your domain: `autowashhub.online`
7. Click **Add**

Vercel will show you the DNS records you need to configure.

## Step 2: Configure DNS Records at Your Domain Registrar

You need to configure DNS records at wherever you purchased your domain (e.g., Namecheap, GoDaddy, Google Domains, etc.).

### ⚠️ IMPORTANT: Clean Up Conflicting Records First

Before adding new records, you need to **DELETE** these conflicting records:

1. **Delete the extra A record** for root domain (`@`) with IP `84.32.84.32`
2. **Delete the ALIAS record** for root domain (`@`) pointing to `58998f1b47cebele.vercel-dns-017.com`
3. **Keep only ONE A record** for root domain with IP `216.198.79.1`

**Why?** Having multiple A records or both A and ALIAS records for the root domain causes conflicts and prevents proper DNS resolution.

### For Root Domain: autowashhub.online

After cleaning up conflicting records:

1. Ensure you have **ONLY ONE** A Record for root domain:
   - **Type**: A
   - **Host/Name**: `@` (or leave blank for root domain)
   - **Value/IP**: `216.198.79.1` ⚠️ **Use this exact IP address**
   - **TTL**: 3600 (or use default)

**Important**: Vercel has updated their IP addresses. Use `216.198.79.1` (the new recommended IP) instead of the old `76.76.21.21`.

### For WWW Subdomain: www.autowashhub.online

1. **Edit the existing CNAME record** for `www`:
   - **Type**: CNAME
   - **Host/Name**: `www`
   - **Value**: `58998f1b47cebele.vercel-dns-017.com.` ⚠️ **Use this exact value** (change from `autowashhub.online`)
   - **TTL**: 3600 (or use default)

**Note**: Make sure to include the trailing dot (`.`) at the end of the CNAME value.

**Leave CAA records alone** - they're fine and don't need to be changed.

## Step 3: Verify Domain in Vercel

After adding DNS records:

1. Go back to Vercel Dashboard → Settings → Domains
2. Vercel will automatically detect when DNS is configured correctly
3. The domain status will change from "Pending" to "Valid"
4. This can take a few minutes to 48 hours (usually within 1-2 hours)

## Step 4: HTTPS Certificate

Vercel automatically provisions SSL certificates for your domain. Once DNS is configured:

- HTTPS will be automatically enabled
- Your site will be accessible at `https://autowashhub.online`
- No additional configuration needed!

## Step 5: DNS Records Summary

Here are the **exact DNS records** you need to add at your domain registrar:

### Record 1: Root Domain

- **Type**: A
- **Name**: `@` (or blank)
- **Value**: `216.198.79.1`
- **TTL**: 3600

### Record 2: WWW Subdomain

- **Type**: CNAME
- **Name**: `www`
- **Value**: `58998f1b47cebele.vercel-dns-017.com.`
- **TTL**: 3600

**Note**: Both domains are already added in your Vercel dashboard. You just need to configure these DNS records at your registrar to resolve the "Invalid Configuration" status.

## Troubleshooting

### Fixing DNS Conflicts (Current Issue)

If you see "Invalid Configuration" in Vercel, check for these common problems:

1. **Multiple A records for root domain**: Delete all except the one with `216.198.79.1`
2. **Both A and ALIAS for root**: Keep only the A record, delete the ALIAS
3. **Wrong CNAME for www**: Should point to `58998f1b47cebele.vercel-dns-017.com.` not `autowashhub.online`

### Domain not working after 48 hours?

1. **Check DNS propagation**: Use [whatsmydns.net](https://www.whatsmydns.net) to check if DNS has propagated globally
2. **Verify DNS records**: Make sure the DNS records match exactly what Vercel provided
3. **Check domain status**: In Vercel Dashboard, check if there are any error messages
4. **Clear DNS cache**: Try accessing from a different network or use `8.8.8.8` DNS

### Common Issues

- **"Invalid configuration"**: Double-check your DNS records match Vercel's requirements. Remove conflicting records.
- **"Domain not found"**: Ensure your DNS records are saved and published at your registrar
- **"Pending" status**: Wait a bit longer - DNS propagation takes time
- **Multiple root domain records**: Only one A record should exist for `@` pointing to `216.198.79.1`

## Current Vercel Configuration

Your project is already configured with:

- ✅ Angular SSR support
- ✅ Proper routing with rewrites
- ✅ Static asset caching
- ✅ Production build configuration

The `vercel.json` file in the `frontend` folder is already set up correctly for your Angular application.

## Need Help?

- [Vercel Domain Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel Support](https://vercel.com/support)
