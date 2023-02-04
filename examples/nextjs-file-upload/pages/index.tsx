import { NextPage } from 'next';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth, useFileUpload, useUser, withWunderGraph } from '../components/generated/nextjs';

const Upload = () => {
	const { login, logout } = useAuth();
	const { data: user } = useUser();

	const [files, setFiles] = useState<FileList>();
	const [data, setData] = useState<string[]>([]);

	const { upload } = useFileUpload({});

	const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files) setFiles(e.target.files);
	};

	let uploadProfile: 'avatar' | 'coverPicture' = 'avatar';

	const onSubmit = async (e: React.FormEvent<Element>) => {
		e.preventDefault();
		if (!files) {
			return;
		}
		try {
			const result = await upload({
				provider: 'minio1',
				profile: uploadProfile,
				files,
			});
			result && setData(result);
		} catch (e) {
			const msg = e instanceof Error ? e.message : 'Upload failed!';
			alert(msg);
			console.error("Couldn't upload files", msg);
		}
	};

	return (
		<div>
			<form className="grid grid-cols-2 items-center gap-4 py-10" onSubmit={onSubmit}>
				<input
					className="col-span-2 border border-slate-500 rounded"
					id="multiple_files"
					type="file"
					multiple
					onChange={onFileChange}
				/>
				<button
					name="avatar"
					className="col-span-1 bg-white text-black px-2 rounded"
					type="submit"
					onClick={() => (uploadProfile = 'avatar')}
				>
					Upload as 'avatar'
				</button>
				<button
					name="coverPicture"
					className="col-span-1 bg-white text-black px-2 rounded"
					type="submit"
					onClick={() => (uploadProfile = 'coverPicture')}
				>
					Upload as 'coverPicture'
				</button>
			</form>
			<ul>
				{data.map((file) => (
					<li data-testid="result" className="text-center mt-8" key={file}>
						Uploaded as {file}
					</li>
				))}
			</ul>
			{!user && (
				<div className="mx-auto">
					<p className="text-gray-400 text-center text-sm">
						You need to be authenticated to upload files to all profiles.
					</p>
					<button className="bg-white text-black p-2 rounded w-full mt-4" type="button" onClick={() => login('gitHub')}>
						Login
					</button>
				</div>
			)}
			{user && (
				<button className="bg-white text-black p-2 rounded w-full mt-4" type="button" onClick={() => logout()}>
					Logout
				</button>
			)}
		</div>
	);
};

const Home: NextPage = () => {
	return (
		<div className="flex flex-col my-auto gap-y-24 lg:gap-y-32 py-4">
			<header className="flex flex-col relative">
				<Image src="/logo.svg" height={120} width={120} alt="WunderGraph Logo" />
				<h1 className="font-extrabold text-4xl lg:text-6xl text-center">WunderGraph File Upload</h1>
				<p className="mt-6 text-lg text-gray-400 text-center">
					Upload multiple files to any S3 compatible file server. Check out the{' '}
					<a
						className="text-cyan-400 hover:underline"
						target="_blank"
						href="https://docs.wundergraph.com/docs/features/file-uploads-to-s3-compatible-file-storages"
					>
						Docs
					</a>
					<br />
				</p>
			</header>
			<Upload />
			<footer className="text-center text-gray-400 mx-auto">
				<p className="pt-3">
					Visit{' '}
					<a
						className="text-cyan-400 hover:underline"
						target="_blank"
						href="https://github.com/wundergraph/wundergraph"
					>
						Github
					</a>{' '}
					or{' '}
					<a className="text-cyan-400 hover:underline" target="_blank" href="https://wundergraph.com">
						Website
					</a>{' '}
					to learn more about WunderGraph.
				</p>
			</footer>
		</div>
	);
};

export default withWunderGraph(Home);
