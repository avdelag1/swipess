UPDATE listings
SET
  latitude = 20.2114,
  longitude = -87.4654,
  updated_at = now()
WHERE status = 'active'
  AND COALESCE(is_active, true) = true
  AND city ILIKE '%tulum%'
  AND (latitude IS NULL OR longitude IS NULL);

SELECT id, title, city, latitude, longitude
FROM listings
WHERE status = 'active'
ORDER BY title;