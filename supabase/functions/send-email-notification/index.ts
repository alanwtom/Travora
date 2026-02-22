// @ts-nocheck
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

type EmailRequest = {
  notification?: {
    id?: string;
    title?: string;
    body?: string;
    userId?: string;
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const payload = (await req.json()) as EmailRequest;
    const notification = payload.notification ?? {};

    console.log(
      JSON.stringify({
        source: 'send-email-notification',
        mode: 'mock',
        notification,
        timestamp: new Date().toISOString(),
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        mode: 'mock',
        message: 'Email notification logged (not sent)',
        notificationId: notification.id ?? null,
        userId: notification.userId ?? null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid request payload',
        error: String(error),
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      }
    );
  }
});
