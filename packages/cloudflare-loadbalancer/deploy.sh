#!/bin/bash

# AIOStreams Cloudflare Load Balancer Deployment Script

echo "=== AIOStreams Cloudflare Load Balancer Deployment ==="
echo "Installing dependencies..."
npm install

echo "Building and deploying worker..."
npx wrangler deploy

echo "=== Deployment Complete ==="
echo "Your load balancer is now deployed to Cloudflare."
echo "Make sure to set up appropriate DNS records pointing aiostreams.example.com to your worker."
echo ""
echo "Test your deployment with:"
echo "curl -I https://aiostreams.example.com" 