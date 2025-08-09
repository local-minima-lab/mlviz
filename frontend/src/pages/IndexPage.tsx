import config from "@/assets/config.json";
import { Button } from "@/components/ui/button";
import type { StoryConfig } from "@/types/story";
import { Link } from "react-router-dom"; // Import Link

const IndexPage = () => {
    const storyConfig = config as StoryConfig;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-stone-50">
            <div className="flex flex-col justify-self-center text-center bg-gradient-to-r from-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                <h1 className="font-extrabold tracking-tighter font-width-expanded pt-8 !text-6xl">
                    mlviz
                </h1>
                <p className="font-normal tracking-tighter pb-8 !text-md">
                    machine learning visualisations
                </p>
            </div>

            <div className="mx-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {Object.entries(storyConfig.stories).map(([name, s]) => (
                    <Link
                        key={s.name}
                        to={`/story/${name}`}
                    >
                        <Button className="w-full h-full flex flex-col items-start justify-end !p-8 text-wrap bg-gradient-to-r from-gray-50 to-stone-50 text-gray-800 hover:from-fuchsia-500 hover:to-cyan-500 hover:text-white transition-all duration-100 hover:shadow-2xl">
                            <span className="font-bold text-left tracking-tight text-lg/5 text-wrap hover:text-white">
                                {s.name}
                            </span>
                            <span className="font-light text-sm tracking-tight text-left text-wrap mt-2">
                                {s.description}
                            </span>
                        </Button>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default IndexPage;
