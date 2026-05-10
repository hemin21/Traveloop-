import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import CommunityPost from '@/lib/models/CommunityPost';

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    // Use getSession (JWT only) — no DB round-trip needed, we only need userId
    const session = await getSession();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = params;
    if (!postId) {
      return NextResponse.json({ error: 'Missing postId' }, { status: 400 });
    }

    await connectToDatabase();

    // Use a single atomic findOneAndUpdate to both toggle and return new state
    const post = await CommunityPost.findById(postId).select('likes').lean() as any;
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isLiked = (post.likes as string[]).includes(userId);
    const updateOp = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await CommunityPost.findByIdAndUpdate(postId, updateOp, { new: true }).select('likes');

    return NextResponse.json({
      liked: !isLiked,
      likesCount: updatedPost?.likes?.length || 0
    });
  } catch (error: any) {
    console.error('Failed to like post:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
