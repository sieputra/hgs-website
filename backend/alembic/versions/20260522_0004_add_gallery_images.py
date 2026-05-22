"""add gallery image content table

Revision ID: 20260522_0004
Revises: 20260522_0003
Create Date: 2026-05-22
"""

from collections.abc import Sequence

from alembic import op


revision: str = "20260522_0004"
down_revision: str | Sequence[str] | None = "20260522_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS gallery_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(150) NOT NULL,
            caption TEXT NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            image_alt VARCHAR(250) NOT NULL,
            original_filename VARCHAR(255),
            content_type VARCHAR(100),
            file_size INTEGER,
            sort_order SMALLINT NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        INSERT INTO gallery_images (
            id,
            title,
            caption,
            image_url,
            image_alt,
            sort_order,
            is_active,
            created_at,
            updated_at
        )
        VALUES
            (
                '8a93a98c-f3bb-4928-87ee-59dc5f5d7401',
                'Operations',
                'Daily logistics activity around HGS fleet and distribution teams.',
                '/images/gallery/rio7985-2.webp',
                'HGS team member checking a truck during operations',
                1,
                true,
                now(),
                now()
            ),
            (
                '3506545f-4a17-4c31-8010-887f83c1d6c2',
                'Colleagues',
                'Most of our time, perhaps is spent with you.',
                '/images/gallery/dsc0632-1-1.webp',
                'HGS colleagues gathered outdoors',
                2,
                true,
                now(),
                now()
            ),
            (
                'cf4de750-9d34-44c5-81e3-ff86c1b46fe7',
                'Office',
                'Coordination and administration keep each delivery route moving.',
                '/images/gallery/img-20171111-wa0007.webp',
                'HGS office team working at computers',
                3,
                true,
                now(),
                now()
            ),
            (
                'e5b891b7-8a32-4b13-9b46-dad9b5f11a04',
                'Fleet Yard',
                'Preparation starts before the first mile leaves the yard.',
                '/images/gallery/dsc0651-1-1.webp',
                'HGS staff observing parked trucks in a yard',
                4,
                true,
                now(),
                now()
            ),
            (
                'cb802d0b-8bb6-4fd9-b72b-ad025b1f9254',
                'Distribution',
                'Goods move through HGS routes with practical field support.',
                '/images/gallery/truck23.webp',
                'HGS green distribution truck on the road',
                5,
                true,
                now(),
                now()
            ),
            (
                '996b877c-481c-46a7-a508-e3bd711a1431',
                'Warehouse',
                'Fleet and warehouse teams work together from loading to dispatch.',
                '/images/gallery/truck.webp',
                'HGS truck parked near a warehouse loading area',
                6,
                true,
                now(),
                now()
            )
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            caption = EXCLUDED.caption,
            image_url = EXCLUDED.image_url,
            image_alt = EXCLUDED.image_alt,
            sort_order = EXCLUDED.sort_order,
            is_active = EXCLUDED.is_active,
            updated_at = now()
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS gallery_images")
