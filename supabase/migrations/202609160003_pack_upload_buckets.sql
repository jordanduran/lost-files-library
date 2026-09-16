begin;
-- Signed uploads are issued only by admin-checked server actions. No client write policies.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('pack-assets','pack-assets',true,31457280,array['image/png','image/jpeg','image/webp','audio/mpeg']),
('lost-files-releases','lost-files-releases',false,1073741824,array['application/zip'])
on conflict(id) do nothing;
commit;
