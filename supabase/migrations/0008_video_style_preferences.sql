-- Blueprint Studio — business-level auto-edit style preferences, added after
-- client feedback that the auto-edit "looks very AI" (the caption font/
-- background specifically) and a request for some customization of the
-- edit. Scoped to what's actually controllable without a new vendor:
-- caption look (font/color/background/position) and edit intensity (zoom/
-- transition amount) - both already fully mechanical RenderScript
-- properties in creatomateProvider.ts, not a new capability.
--
-- caption_style default is 'outline-pop' (not the old bold-pill look) for
-- every business, including ones that already exist - the whole point of
-- this change is to stop shipping the look that was specifically flagged as
-- generic, so existing businesses get the fix by default and can switch
-- back to 'bold-pill' if they actually preferred it. edit_style defaults to
-- 'punchy', which matches the zoom/transition values already hardcoded
-- before this migration, so no existing business's motion style changes
-- unless they opt into 'subtle'.

alter table businesses
  add column caption_style text not null default 'outline-pop',
  add column edit_style text not null default 'punchy';

alter table businesses
  add constraint businesses_caption_style_check check (caption_style in ('outline-pop', 'bold-pill', 'minimal'));

alter table businesses
  add constraint businesses_edit_style_check check (edit_style in ('subtle', 'punchy'));
