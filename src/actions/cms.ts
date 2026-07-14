'use server';

import { createClient } from '@/utils/supabase/server';
import { createAuditLog } from './audit';
import { revalidatePath } from 'next/cache';

export async function createContentBlock(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied: Only Global Admin can modify website blocks' };
  }

  const { data: block, error } = await supabase
    .from('website_content_blocks')
    .insert({
      page_id: data.pageId,
      block_type: data.blockType,
      sort_order: data.sortOrder,
      heading: data.heading,
      body: data.body,
      image_path: data.imagePath,
      image_alt_text: data.imageAltText,
      button_label: data.buttonLabel,
      button_url: data.buttonUrl,
      alignment: data.alignment || 'left',
      published_status: data.publishedStatus !== undefined ? data.publishedStatus : true,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Website Block Created',
    'website_content_blocks',
    block.id,
    `Created block of type ${data.blockType} under page ID ${data.pageId}.`
  );

  revalidatePath('/');
  revalidatePath('/about');
  return { success: true };
}

export async function updateContentBlock(blockId: string, data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied' };
  }

  const { error } = await supabase
    .from('website_content_blocks')
    .update({
      block_type: data.blockType,
      sort_order: data.sortOrder,
      heading: data.heading,
      body: data.body,
      image_path: data.imagePath,
      image_alt_text: data.imageAltText,
      button_label: data.buttonLabel,
      button_url: data.buttonUrl,
      alignment: data.alignment,
      published_status: data.publishedStatus,
    })
    .eq('id', blockId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Website Block Updated',
    'website_content_blocks',
    blockId,
    `Updated block ${blockId} heading or configuration.`
  );

  revalidatePath('/');
  revalidatePath('/about');
  return { success: true };
}

export async function deleteContentBlock(blockId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied' };
  }

  const { error } = await supabase
    .from('website_content_blocks')
    .delete()
    .eq('id', blockId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Website Block Deleted',
    'website_content_blocks',
    blockId,
    `Deleted content block ID ${blockId}.`
  );

  revalidatePath('/');
  revalidatePath('/about');
  return { success: true };
}

export async function createGalleryItem(data: any) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied' };
  }

  const { data: item, error } = await supabase
    .from('gallery_items')
    .insert({
      title: data.title,
      caption: data.caption,
      alt_text: data.altText,
      category: data.category,
      storage_path: data.storagePath,
      display_order: data.displayOrder || 0,
      published_status: data.publishedStatus !== undefined ? data.publishedStatus : true,
      is_cover: data.isCover || false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Gallery Item Created',
    'gallery_items',
    item.id,
    `Gallery image uploaded and referenced: ${data.title}`
  );

  revalidatePath('/gallery');
  return { success: true };
}

export async function deleteGalleryItem(itemId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'global_admin') {
    return { success: false, error: 'Access Denied' };
  }

  const { error } = await supabase
    .from('gallery_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    return { success: false, error: error.message };
  }

  await createAuditLog(
    'Gallery Item Deleted',
    'gallery_items',
    itemId,
    `Gallery item ID ${itemId} deleted.`
  );

  revalidatePath('/gallery');
  return { success: true };
}
