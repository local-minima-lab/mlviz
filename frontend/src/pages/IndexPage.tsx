import config from "@/assets/config.json";
import { Button } from "@/components/ui/button";
import type { Config } from "@/types/story";
import { Link } from "react-router-dom"; // Import Link

const IndexPage = () => {
    const storyConfig = config as unknown as Config;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-stone-50">
            <div className="h-[15dvh] flex flex-col justify-self-center text-center bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                <h1 className="font-extrabold tracking-tighter font-width-expanded pt-8 !text-6xl">
                    mlviz
                </h1>
                <p className="font-normal tracking-tighter pb-8 !text-md">
                    machine learning visualisations
                </p>
            </div>

            <div className="h-[80dvh] mx-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {Object.entries(storyConfig.stories).map(([name, s]) => (
                    <Link
                        key={s.name}
                        to={`/story/${name}`}
                    >
                        <Button className="w-full h-1/4 flex flex-col items-start justify-between !p-8 text-wrap bg-gradient-to-r from-gray-50 to-stone-50 text-gray-800 hover:from-blue-50 hover:to-purple-50 hover:text-black transition-all duration-100 hover:shadow-2xl font-light hover:font-medium">
                            <span className="font-mono text-left tracking-tight text-lg/5 text-wrap bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                                {s.name}
                            </span>
                            <span className="text-sm tracking-tight text-left text-wrap mt-2">
                                {s.description}
                            </span>
                        </Button>
                    </Link>
                ))}
            </div>

            <footer className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm tracking-tight">
                <Link
                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent font-semibold font-mono hover:opacity-80 transition-opacity"
                    to={"https://github.com/local-minima-lab"}
                >
                    a project by Local Minima Lab
                </Link>
                <Link
                    className="px-3 py-1.5 rounded-md bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent font-mono hover:opacity-80 transition-opacity"
                    to={"https://github.com/zaidansani"}
                >
                    @zaidansani
                </Link>
            </footer>
        </div>
    );
};

export default IndexPage;
