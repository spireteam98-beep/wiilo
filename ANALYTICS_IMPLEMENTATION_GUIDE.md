# Advanced Analytics Implementation Guide

This guide explains how to track advanced user interactions and conversion flows in the Wiilo blog platform.

## New Analytics Events

### Event Types

The analytics system now supports 6 event types:

| Event | Description | When to Track |
|-------|-------------|---------------|
| `open_modal` | User opens the article modal | When user clicks to read article |
| `share_click` | User clicks the share button | When user initiates sharing |
| `shared_to_contact` | User shares to a specific contact | When user selects recipient and sends |
| `open_share_link` | User opens a link shared by someone else | When following a shared link |
| `received_shared_link` | User receives a shared link | When link is sent/shared to them |
| `conversion` | User who opened shared link then shares it themselves | When a received-link user becomes a sharer |

## Tracking API

### Endpoint
```
POST /api/analytics/track
```

### Request Payload

```typescript
{
  articleId: string;           // Required: The article ID
  eventType: string;           // Required: One of the 6 event types above
  sessionId?: string;          // Optional: User session identifier (auto-generated if not provided)
  userId?: string;             // Optional: User identifier (defaults to "anonymous")
  referrer?: string;           // Optional: Where the user came from
  source?: string;             // Optional: Source of traffic (defaults to "web")
  additionalData?: object;     // Optional: Custom tracking data
}
```

### Response

```typescript
{
  ok: boolean;
  sessionId: string;  // Return session ID for client to reuse
}
```

## Implementation Examples

### 1. Tracking Article Modal Opens

```typescript
const trackEvent = async (articleId: string, eventType: string) => {
  try {
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        articleId,
        eventType,
        source: "home",
      }),
    });
    const data = await response.json();
    return data.sessionId; // Store for later use
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
};

// Track when user opens article
trackEvent(articleId, "open_modal");
```

### 2. Tracking Share Interactions

```typescript
const trackShare = async (articleId: string, sessionId?: string) => {
  try {
    const response = await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        eventType: "share_click",
        sessionId,
        source: "share_button",
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Failed to track share click:", error);
  }
};

// Track when user clicks share
const shareUrl = `${publicSiteUrl}/article/${articleId}`;
await trackShare(articleId, currentSessionId);
```

### 3. Tracking Shared Link Opens (Received Links)

```typescript
const trackSharedLinkOpen = async (articleId: string, referrerSessionId?: string) => {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        eventType: "open_share_link",
        referrer: referrerSessionId,
        source: "shared_link",
        additionalData: {
          utm_source: "shared_link",
        },
      }),
    });
  } catch (error) {
    console.error("Failed to track share link open:", error);
  }
};

// Call when detecting user came from a shared link
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const shared = params.get("shared") === "true";
  if (shared && articleId) {
    trackSharedLinkOpen(articleId);
  }
}, [articleId]);
```

### 4. Tracking Explicit Contact Sharing

```typescript
const trackSharedToContact = async (
  articleId: string,
  contactEmail: string,
  method: "email" | "sms" | "social",
  sessionId?: string
) => {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        eventType: "shared_to_contact",
        sessionId,
        source: method,
        additionalData: {
          method,
          contactEmail: hashEmail(contactEmail), // Don't send raw email
        },
      }),
    });
  } catch (error) {
    console.error("Failed to track contact share:", error);
  }
};

// Call when user shares to specific contact
await trackSharedToContact(
  articleId,
  recipientEmail,
  "email",
  currentSessionId
);
```

### 5. Tracking Conversions (Shared Link → Share)

```typescript
const trackConversion = async (
  articleId: string,
  originalSessionId: string,
  sessionId?: string
) => {
  try {
    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        eventType: "conversion",
        sessionId: sessionId || originalSessionId,
        referrer: originalSessionId,
        additionalData: {
          conversionType: "shared_link_to_sharer",
        },
      }),
    });
  } catch (error) {
    console.error("Failed to track conversion:", error);
  }
};

// Call when a user who opened a shared link then shares it
const handleConversion = async () => {
  if (userOpenedViaSharedLink && nowSharingArticle) {
    await trackConversion(articleId, originalReferrerSessionId, currentSessionId);
  }
};
```

## Session Management

The analytics system automatically creates sessions, but you can optimize tracking by:

1. **Storing sessionId** from the first response
2. **Reusing sessionId** in subsequent events within same session
3. **Tracking session duration** to understand user engagement

```typescript
const [sessionId, setSessionId] = useState<string | null>(null);

useEffect(() => {
  // Get or create session ID on mount
  const existingSessionId = sessionStorage.getItem("analytics_session_id");
  if (existingSessionId) {
    setSessionId(existingSessionId);
  } else {
    // First event will return new sessionId
    trackEvent(articleId, "open_modal").then((newSessionId) => {
      if (newSessionId) {
        setSessionId(newSessionId);
        sessionStorage.setItem("analytics_session_id", newSessionId);
      }
    });
  }
}, []);
```

## Analytics Dashboard

The enhanced admin dashboard displays:

### Summary View
- Modal Opens: Count of users who opened articles
- Share Clicks: Users who clicked share button
- Shared to Contacts: Explicit contact shares
- Share Link Opens: Users who opened shared links
- Received Shared Links: Times a link was shared
- Conversions: Users converted from link opener to sharer
- **Conversion Rate**: Percentage of shares that led to conversions
- **Total Engagement**: Sum of all interactions
- **Unique Sessions**: Number of unique users/sessions

### Detailed View
- All metrics in card layout for better visualization
- **Daily Breakdown**: Time-series data showing daily metrics
- Expandable sections to view trends

## Best Practices

1. **Always use keepalive for tracking calls** - Prevents lost analytics on page unload
   ```typescript
   keepalive: true
   ```

2. **Use consistent articleId** - Ensures data is properly aggregated

3. **Track at the right moment**:
   - `open_modal` - When user starts reading
   - `share_click` - When user clicks share button
   - `shared_to_contact` - After confirmation/send
   - `open_share_link` - On shared link page load
   - `conversion` - When converted user shares

4. **Use additionalData for context**:
   ```typescript
   additionalData: {
     device: "mobile",
     articleCategory: "lifestyle",
     readTime: 5, // minutes
   }
   ```

5. **Don't block UI for analytics** - Always wrap in try/catch and let fail silently

6. **Monitor session data** - Use sessionId to understand user journeys

## Example: Complete Sharing Flow

```typescript
// User opens article
const sessionId = await trackEvent(articleId, "open_modal");
sessionStorage.setItem("session_" + articleId, sessionId);

// User clicks share
await trackShare(articleId, sessionId);

// If shared to contact
await trackSharedToContact(articleId, email, "email", sessionId);

// Someone opens the shared link
await trackSharedLinkOpen(articleId, sessionId);

// If that person then shares
await trackConversion(articleId, sessionId);
```

## Query Analytics Data

Access the admin panel to see all analytics:
- Navigate to `/admin/myblog-posts`
- Click "Refresh Analytics"
- Switch between Summary and Detailed views
- Expand articles to see daily breakdowns

---

For questions or improvements, check the [analytics API routes](./src/app/api/analytics/)
