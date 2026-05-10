const { GET } = require('./.next/server/app/api/invoice/[tripId]/route.js');
// Wait, Next.js routes are compiled, so calling GET from node directly won't work well due to next/server dependencies.
