
-- Function to get allocations by profession
CREATE OR REPLACE FUNCTION get_allocations_by_profession(profession_id UUID)
RETURNS TABLE (
  project_name TEXT,
  user_name TEXT,
  user_role TEXT,
  user_image_url TEXT,
  profession TEXT,
  week DATE,
  days INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.name AS project_name,
    u.name AS user_name,
    u.role AS user_role,
    u.image_url AS user_image_url,
    pr.title AS profession,
    a.week,
    a.days
  FROM allocations a
  JOIN users u ON a.user_id = u.id
  JOIN user_professions up ON u.id = up.user_id
  JOIN professions pr ON up.profession_id = pr.id
  JOIN projects p ON a.project_id = p.id
  WHERE pr.id = profession_id
  ORDER BY a.week;
END;
$$;
