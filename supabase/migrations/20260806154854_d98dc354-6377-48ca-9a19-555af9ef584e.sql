
CREATE POLICY "product media read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-media');
CREATE POLICY "product media insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-media' AND public.is_admin());
CREATE POLICY "product media update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-media' AND public.is_admin()) WITH CHECK (bucket_id = 'product-media' AND public.is_admin());
CREATE POLICY "product media delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-media' AND public.is_admin());
