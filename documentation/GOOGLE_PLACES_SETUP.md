# Google Places API Setup Guide

## Getting Your API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create or Select a Project**
   - Click on the project dropdown at the top
   - Click "New Project" or select an existing one

3. **Enable Required APIs**
   - Go to "APIs & Services" → "Library"
   - Search for and enable these APIs:
     - **Places API** (for autocomplete and details)
     - **Places API (New)** (optional, for better features)
     - **Geocoding API** (backup, optional)

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

5. **Secure Your API Key** (Important!)
   - Click "Restrict Key" after creation
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled
   - Under "Application restrictions":
     - For development: Select "HTTP referrers" and add `localhost:*` and your domain
     - For production: Add your production domain

6. **Add to Your Project**
   - Create/edit `.env.local` in your project root:
   ```bash
   NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

## Cost Management

### Free Tier
- Google provides $200/month in free credits
- This covers approximately:
  - ~2,800 autocomplete sessions/month
  - ~2,800 place details requests/month
  - ~1,400 nearby searches/month

### How We Optimize Costs

1. **Session Tokens** 
   - Groups autocomplete requests together
   - One session = multiple autocomplete calls + 1 place details call
   - Much cheaper than individual requests

2. **Debounced Search**
   - 300ms delay before searching
   - Reduces API calls while typing

3. **IP-based Country Detection**
   - Free (uses myip.com)
   - Instead of Google's reverse geocoding

4. **Result Caching**
   - Place details cached in component state
   - Reduces duplicate API calls

### Monitoring Usage

1. **Set Up Budget Alerts**
   - Go to "Billing" → "Budgets & alerts"
   - Set budget to $200 (or your preferred limit)
   - Add email alerts at 50%, 90%, 100%

2. **Monitor Usage**
   - Go to "APIs & Services" → "Dashboard"
   - Check daily/monthly usage graphs
   - Each API shows request counts

3. **Set Usage Quotas** (Recommended)
   - Go to "APIs & Services" → "Credentials"
   - Edit your API key
   - Set quotas per day/minute
   - Recommended: 100 requests/minute, 5,000/day

## Switching Providers

To switch between Google Places and Mapbox:

```bash
# In .env.local
NEXT_PUBLIC_LOCATION_PROVIDER=google  # or 'mapbox'
```

## Troubleshooting

### "This API project is not authorized to use this API"
- Enable the required APIs in Google Cloud Console
- Wait 2-3 minutes for changes to propagate

### "API key not valid"
- Check the key is correctly copied to `.env.local`
- Ensure no spaces or quotes around the key
- Check API restrictions allow your domain/localhost

### "OVER_QUERY_LIMIT"
- You've exceeded daily quota
- Check usage in Google Cloud Console
- Consider setting up billing alerts
- Reduce search radius in settings

### High costs
- Check for API call loops in console logs
- Ensure session tokens are being used
- Consider switching to Mapbox for some features
- Reduce search frequency/radius

## Alternative: Using Mapbox Only

If you want to avoid Google Places costs entirely:

```bash
# In .env.local
NEXT_PUBLIC_LOCATION_PROVIDER=mapbox
```

**Trade-offs:**
- ✅ Free geocoding (up to 100k/month)
- ✅ Good for addresses and landmarks
- ❌ Limited POI/business data
- ❌ No detailed business information
- ❌ No nearby search by category

## Best Practices

1. **Development**
   - Use Mapbox during development
   - Switch to Google for production/testing features

2. **Production**
   - Monitor usage weekly
   - Set strict budget alerts
   - Consider hybrid approach (Mapbox + Google)

3. **User Experience**
   - Keep default search radius at 5km
   - Consider caching popular searches
   - Add loading states for API calls

## Support

For issues related to:
- **Google API**: https://issuetracker.google.com/issues?q=componentid:187149
- **This implementation**: Check console logs with `[API]`, `[GooglePlaces]` prefixes

